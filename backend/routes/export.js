const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// @GET /api/export/csv?month=&year=&type=
router.get('/csv', auth, async (req, res) => {
  try {
    const { month, year, type } = req.query;
    const filter = { user: req.user._id };

    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      filter.date = {
        $gte: new Date(y, m - 1, 1),
        $lte: new Date(y, m, 0, 23, 59, 59)
      };
    }
    if (type) filter.type = type;

    const transactions = await Transaction.find(filter).sort('-date');

    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const rows = transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.type,
      t.category,
      t.description,
      t.amount.toFixed(2)
    ]);

    const csv = [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="budgetbuddy-transactions-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @GET /api/export/json?month=&year=
router.get('/json', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = { user: req.user._id };

    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      filter.date = {
        $gte: new Date(y, m - 1, 1),
        $lte: new Date(y, m, 0, 23, 59, 59)
      };
    }

    const transactions = await Transaction.find(filter).sort('-date');
    const total = {
      income: transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expenses: transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    };

    res.setHeader('Content-Disposition', `attachment; filename="budgetbuddy-report-${Date.now()}.json"`);
    res.json({ generatedAt: new Date(), summary: { ...total, balance: total.income - total.expenses }, transactions });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
