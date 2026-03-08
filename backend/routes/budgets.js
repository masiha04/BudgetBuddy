const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// @GET /api/budgets
router.get('/', auth, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user._id }).sort('-year -month');
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @GET /api/budgets/current
router.get('/current', auth, async (req, res) => {
  try {
    const now = new Date();
    const budget = await Budget.findOne({
      user: req.user._id,
      month: now.getMonth() + 1,
      year: now.getFullYear()
    });
    if (!budget) return res.json(null);

    // Get actual spending for this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const expenses = await Transaction.find({
      user: req.user._id,
      type: 'expense',
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
    const spentByCategory = {};
    expenses.forEach(t => {
      spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.amount;
    });

    const alerts = [];
    const threshold = budget.alertThreshold / 100;

    if (totalSpent >= budget.totalLimit * threshold) {
      alerts.push({
        type: 'total',
        message: `You've used ${((totalSpent / budget.totalLimit) * 100).toFixed(1)}% of your total budget`,
        severity: totalSpent >= budget.totalLimit ? 'exceeded' : 'warning'
      });
    }

    budget.categoryLimits.forEach(cl => {
      const spent = spentByCategory[cl.category] || 0;
      if (spent >= cl.limit * threshold) {
        alerts.push({
          type: 'category',
          category: cl.category,
          message: `${cl.category}: ${((spent / cl.limit) * 100).toFixed(1)}% used`,
          severity: spent >= cl.limit ? 'exceeded' : 'warning'
        });
      }
    });

    res.json({ budget, totalSpent, spentByCategory, alerts });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @GET /api/budgets/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    res.json(budget);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @POST /api/budgets
router.post('/', auth, [
  body('name').notEmpty().withMessage('Budget name required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Valid month required'),
  body('year').isInt({ min: 2000 }).withMessage('Valid year required'),
  body('totalLimit').isFloat({ min: 0 }).withMessage('Total limit must be positive')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const existing = await Budget.findOne({ user: req.user._id, month: req.body.month, year: req.body.year });
    if (existing) return res.status(400).json({ message: 'Budget already exists for this month/year' });

    const budget = new Budget({ ...req.body, user: req.user._id });
    await budget.save();
    res.status(201).json(budget);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @PUT /api/budgets/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    res.json(budget);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @DELETE /api/budgets/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
