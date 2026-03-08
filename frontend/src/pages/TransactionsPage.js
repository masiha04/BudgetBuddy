import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import './TransactionsPage.css';

const INCOME_CATS = ['Salary','Freelance','Investment','Business','Gift','Rental','Other Income'];
const EXPENSE_CATS = ['Housing','Transportation','Food & Dining','Healthcare','Entertainment','Shopping','Utilities','Education','Insurance','Personal Care','Travel','Subscriptions','Savings','Other Expense'];

const emptyForm = { type: 'expense', amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0] };

export default function TransactionsPage() {
  const { user } = useAuth();
  const cur = user?.currency || 'USD';
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ type: '', category: '', startDate: '', endDate: '' });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, sort: '-date', ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) };
      const res = await api.get('/transactions', { params });
      setTransactions(res.data.transactions);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (e) {}
    setLoading(false);
  }, [page, filters]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setFormError(''); setShowModal(true); };
  const openEdit = (tx) => {
    setEditing(tx._id);
    setForm({ type: tx.type, amount: tx.amount, category: tx.category, description: tx.description, date: tx.date.split('T')[0] });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/transactions/${editing}`, form);
      } else {
        await api.post('/transactions', form);
      }
      setShowModal(false);
      fetchTransactions();
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Error saving transaction');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (e) {}
  };

  const categories = form.type === 'income' ? INCOME_CATS : EXPENSE_CATS;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{total} total transactions</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Transaction</button>
      </div>

      {/* Filters */}
      <div className="card filters-card">
        <div className="filters-grid">
          <select className="form-select" value={filters.type} onChange={e => { setFilters({...filters, type: e.target.value}); setPage(1); }}>
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input type="date" className="form-input" value={filters.startDate} onChange={e => { setFilters({...filters, startDate: e.target.value}); setPage(1); }} placeholder="Start date" />
          <input type="date" className="form-input" value={filters.endDate} onChange={e => { setFilters({...filters, endDate: e.target.value}); setPage(1); }} placeholder="End date" />
          <button className="btn btn-secondary" onClick={() => { setFilters({ type: '', category: '', startDate: '', endDate: '' }); setPage(1); }}>Clear</button>
        </div>
      </div>

      {/* Table */}
      <div className="card tx-table-card">
        {loading ? (
          <div className="loading-screen"><div className="spinner"></div></div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-text">No transactions found</div>
            <div className="empty-state-sub">Add your first transaction to get started</div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={openAdd}>Add Transaction</button>
          </div>
        ) : (
          <>
            <div className="tx-table-wrap">
              <table className="tx-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx._id}>
                      <td className="tx-date-col">{formatDate(tx.date)}</td>
                      <td><span className={`badge badge-${tx.type}`}>{tx.type}</span></td>
                      <td className="tx-cat-col">{tx.category}</td>
                      <td className="tx-desc-col">{tx.description || '—'}</td>
                      <td>
                        <span className={`tx-amount-cell ${tx.type}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, cur)}
                        </span>
                      </td>
                      <td>
                        <div className="tx-actions">
                          <button className="action-btn edit" onClick={() => openEdit(tx)} title="Edit">✎</button>
                          <button className="action-btn delete" onClick={() => handleDelete(tx._id)} title="Delete">✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="pagination">
                <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p-1)} disabled={page === 1}>← Prev</button>
                <span className="page-info">{page} / {pages}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p+1)} disabled={page === pages}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{formError}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value, category: '' })}>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount</label>
                    <input type="number" className="form-input" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} min="0.01" step="0.01" placeholder="0.00" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                      <option value="">Select category</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Description (optional)</label>
                    <input type="text" className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Add a note..." />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : editing ? 'Update' : 'Add Transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
