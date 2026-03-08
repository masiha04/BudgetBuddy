export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

export const formatMonth = (month, year) => {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric'
  });
};

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const CATEGORY_COLORS = {
  'Salary': '#6c63ff',
  'Freelance': '#3498db',
  'Investment': '#2ecc71',
  'Business': '#9b59b6',
  'Gift': '#f39c12',
  'Rental': '#1abc9c',
  'Other Income': '#7f8c8d',
  'Housing': '#e74c3c',
  'Transportation': '#e67e22',
  'Food & Dining': '#f1c40f',
  'Healthcare': '#27ae60',
  'Entertainment': '#8e44ad',
  'Shopping': '#d35400',
  'Utilities': '#2980b9',
  'Education': '#16a085',
  'Insurance': '#c0392b',
  'Personal Care': '#e91e63',
  'Travel': '#00bcd4',
  'Subscriptions': '#673ab7',
  'Savings': '#4caf50',
  'Other Expense': '#607d8b',
};

export const getCategoryColor = (category) => {
  return CATEGORY_COLORS[category] || '#6c63ff';
};
