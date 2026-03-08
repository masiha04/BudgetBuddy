const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  totalLimit: {
    type: Number,
    required: true,
    min: 0
  },
  categoryLimits: [
    {
      category: { type: String, required: true },
      limit: { type: Number, required: true, min: 0 }
    }
  ],
  alertThreshold: {
    type: Number,
    default: 80,
    min: 1,
    max: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

budgetSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
