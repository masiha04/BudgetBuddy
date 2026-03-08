const mongoose = require('mongoose');

const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Rental', 'Other Income'
];

const EXPENSE_CATEGORIES = [
  'Housing', 'Transportation', 'Food & Dining', 'Healthcare', 'Entertainment',
  'Shopping', 'Utilities', 'Education', 'Insurance', 'Personal Care',
  'Travel', 'Subscriptions', 'Savings', 'Other Expense'
];

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

transactionSchema.statics.INCOME_CATEGORIES = INCOME_CATEGORIES;
transactionSchema.statics.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;

module.exports = mongoose.model('Transaction', transactionSchema);
