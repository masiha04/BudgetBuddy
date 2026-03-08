import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatCurrency, formatMonth } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import './BudgetPage.css';

const EXPENSE_CATS = ['Housing','Transportation','Food & Dining','Healthcare','Entertainment','Shopping','Utilities','Education','Insurance','Personal Care','Travel','Subscriptions','Savings','Other Expense'];

const now = new Date();

export default function BudgetPage() {
  const { user } = useAuth();
  const cur = user?.currency || 'USD';
  const [budgets, setBudgets] = useState([]);
  const [currentBudget, setCurrentBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: `Budget ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    totalLimit: '',
    alertThreshold: 80,
    categoryLimits: []
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [b, c] = await Promise.all([api.get('/budgets'), api.get('/budgets/current')]);
      setBudgets(b.data);
      setCurrentBudget(c.data);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: `Budget ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      month: now.getMonth() + 1, year: now.getFullYear(),
      totalLimit: '', alertThreshold: 80, categoryLimits: []
    });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = async (budget) => {
    setEditing(budget._id);
    setForm({
      name: budget.name, month: budget.month, year: budget.year,
      totalLimit: budget.totalLimit, alertThreshold: budget.alertThreshold,
      categoryLimits: budget.categoryLimits || []
    });
    setFormError('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    await api.delete(`/budgets/${id}`);
    fetchData();
  };

  const handleCatLimit = (cat, val) => {
    const existing = form.categoryLimits.find(cl => cl.category === cat);
    if (existing) {
      setForm({ ...form, categoryLimits: form.categoryLimits.map(cl => cl.category === cat ? { ...cl, limit: val } : cl) });
    } else {
      setForm({ ...form, categoryLimits: [...form.categoryLimits, { category: cat, limit: val }] });
    }
  };

  const getCatLimit = (cat) => {
    return form.categoryLimits.find(cl => cl.category === cat)?.limit || '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        categoryLimits: form.categoryLimits.filter(cl => cl.limit > 0).map(cl => ({ ...cl, limit: Number(cl.limit) }))
      };
      if (editing) {
        await api.put(`/budgets/${editing}`, payload);
      } else {
        await api.post('/budgets', payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving budget');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Budget</h1>
          <p className="page-subtitle">Track and manage your monthly spending limits</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Create Budget</button>
      </div>

      {/* Current month budget status */}
      {currentBudget?.budget && (
        <div className="card current-budget-card">
          <div className="cb-header">
            <div>
              <h3 className="card-title">Current Month — {currentBudget.budget.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                Alert at {currentBudget.budget.alertThreshold}% usage
              </p>
            </div>
            <div className="cb-summary">
              <span className="cb-spent">{formatCurrency(currentBudget.totalSpent, cur)}</span>
              <span className="cb-of">/ {formatCurrency(currentBudget.budget.totalLimit, cur)}</span>
            </div>
          </div>

          {currentBudget.alerts?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {currentBudget.alerts.map((a, i) => (
                <div key={i} className={`alert ${a.severity === 'exceeded' ? 'alert-error' : 'alert-warning'}`}>
                  {a.severity === 'exceeded' ? '⚠️' : '🔔'} {a.message}
                </div>
              ))}
            </div>
          )}

          <div className="cb-progress">
            {(() => {
              const pct = Math.min((currentBudget.totalSpent / currentBudget.budget.totalLimit) * 100, 100);
              return (
                <>
                  <div className="budget-bar">
                    <div className={`budget-bar-fill ${pct >= 100 ? 'exceeded' : pct >= currentBudget.budget.alertThreshold ? 'warning' : ''}`}
                      style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="budget-pct">{pct.toFixed(1)}%</span>
                </>
              );
            })()}
          </div>

          {currentBudget.budget.categoryLimits?.length > 0 && (
            <div className="cat-limits-grid">
              {currentBudget.budget.categoryLimits.map(cl => {
                const spent = currentBudget.spentByCategory?.[cl.category] || 0;
                const pct = Math.min((spent / cl.limit) * 100, 100);
                return (
                  <div key={cl.category} className="cat-limit-item">
                    <div className="cat-limit-header">
                      <span className="cat-name">{cl.category}</span>
                      <span className={`cat-pct ${pct >= 100 ? 'exceeded' : pct >= 80 ? 'warning' : ''}`}>{pct.toFixed(0)}%</span>
                    </div>
                    <div className="cat-amounts">
                      <span>{formatCurrency(spent, cur)}</span>
                      <span style={{ color: 'var(--text-muted)' }}>/ {formatCurrency(cl.limit, cur)}</span>
                    </div>
                    <div className="budget-bar mini">
                      <div className={`budget-bar-fill ${pct >= 100 ? 'exceeded' : pct >= 80 ? 'warning' : ''}`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Budget list */}
      <div className="budgets-list">
        {budgets.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">No budgets created</div>
              <div className="empty-state-sub">Create your first monthly budget</div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={openAdd}>Create Budget</button>
            </div>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, color: 'var(--text-secondary)' }}>All Budgets</h2>
            <div className="budgets-grid">
              {budgets.map(b => (
                <div key={b._id} className="card budget-card">
                  <div className="budget-card-header">
                    <div>
                      <div className="budget-card-name">{b.name}</div>
                      <div className="budget-card-period">{formatMonth(b.month, b.year)}</div>
                    </div>
                    <div className="budget-card-actions">
                      <button className="action-btn edit" onClick={() => openEdit(b)}>✎</button>
                      <button className="action-btn delete" onClick={() => handleDelete(b._id)}>✕</button>
                    </div>
                  </div>
                  <div className="budget-card-limit">
                    <span className="budget-card-amount">{formatCurrency(b.totalLimit, cur)}</span>
                    <span className="budget-card-cats">{b.categoryLimits?.length || 0} categories</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit Budget' : 'Create Budget'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{formError}</div>}
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Budget Name</label>
                    <input type="text" className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Month</label>
                      <select className="form-select" value={form.month} onChange={e => setForm({ ...form, month: Number(e.target.value) })}>
                        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                          <option key={i} value={i+1}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Year</label>
                      <input type="number" className="form-input" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} min="2000" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Alert at (%)</label>
                      <input type="number" className="form-input" value={form.alertThreshold} onChange={e => setForm({ ...form, alertThreshold: Number(e.target.value) })} min="1" max="100" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Spending Limit</label>
                    <input type="number" className="form-input" value={form.totalLimit} onChange={e => setForm({ ...form, totalLimit: e.target.value })} min="0" step="0.01" placeholder="0.00" required />
                  </div>

                  <div>
                    <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>Category Limits (optional)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 280, overflowY: 'auto', padding: '2px 4px' }}>
                      {EXPENSE_CATS.map(cat => (
                        <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                          <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)' }}>{cat}</span>
                          <input
                            type="number"
                            className="form-input"
                            style={{ width: 90, padding: '4px 8px', fontSize: 12 }}
                            value={getCatLimit(cat)}
                            onChange={e => handleCatLimit(cat, e.target.value)}
                            min="0"
                            placeholder="Limit"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modal-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-color)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : editing ? 'Update Budget' : 'Create Budget'}
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
