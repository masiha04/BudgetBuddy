const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// @GET /api/analytics/summary?month=&year=
router.get('/summary', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const m = parseInt(month) || now.getMonth() + 1;
    const y = parseInt(year) || now.getFullYear();

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: start, $lte: end }
    });

    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    res.json({ income, expenses, balance: income - expenses, transactionCount: transactions.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @GET /api/analytics/monthly?year=
router.get('/monthly', auth, async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const transactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: start, $lte: end }
    });

    const monthly = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expenses: 0
    }));

    transactions.forEach(t => {
      const m = new Date(t.date).getMonth();
      if (t.type === 'income') monthly[m].income += t.amount;
      else monthly[m].expenses += t.amount;
    });

    res.json(monthly);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @GET /api/analytics/by-category?type=expense&month=&year=
router.get('/by-category', auth, async (req, res) => {
  try {
    const { type = 'expense', month, year } = req.query;
    const now = new Date();
    const m = parseInt(month) || now.getMonth() + 1;
    const y = parseInt(year) || now.getFullYear();

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);

    const result = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type,
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json(result.map(r => ({ category: r._id, total: r.total, count: r.count })));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @GET /api/analytics/trend?months=6
router.get('/trend', auth, async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const transactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: start }
    });

    const trendMap = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!trendMap[key]) trendMap[key] = { month: key, income: 0, expenses: 0 };
      if (t.type === 'income') trendMap[key].income += t.amount;
      else trendMap[key].expenses += t.amount;
    });

    const trend = Object.values(trendMap).sort((a, b) => a.month.localeCompare(b.month));
    res.json(trend);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @GET /api/analytics/recent
router.get('/recent', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort('-date')
      .limit(5);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
