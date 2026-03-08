import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/format';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import './DashboardPage.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="stat-card" style={{ '--accent': color }}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-body">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, m, c, r, b] = await Promise.all([
          api.get('/analytics/summary'),
          api.get(`/analytics/monthly?year=${new Date().getFullYear()}`),
          api.get('/analytics/by-category?type=expense'),
          api.get('/analytics/recent'),
          api.get('/budgets/current')
        ]);
        setSummary(s.data);
        setMonthlyData(m.data);
        setCategoryData(c.data.slice(0, 6));
        setRecentTx(r.data);
        setBudgetData(b.data);
      } catch (e) {}
      setLoading(false);
    };
    load();
  }, []);

  const cur = user?.currency || 'USD';

  const barData = {
    labels: MONTH_NAMES,
    datasets: [
      {
        label: 'Income',
        data: monthlyData.map(m => m.income),
        backgroundColor: 'rgba(108, 99, 255, 0.7)',
        borderRadius: 6,
      },
      {
        label: 'Expenses',
        data: monthlyData.map(m => m.expenses),
        backgroundColor: 'rgba(255, 101, 132, 0.7)',
        borderRadius: 6,
      }
    ]
  };

  const doughnutData = {
    labels: categoryData.map(c => c.category),
    datasets: [{
      data: categoryData.map(c => c.total),
      backgroundColor: [
        '#6c63ff','#ff6584','#2ecc71','#f39c12','#3498db','#9b59b6'
      ],
      borderWidth: 0,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#9094b0', font: { family: 'DM Sans' } } },
      tooltip: {
        callbacks: {
          label: ctx => ` ${formatCurrency(ctx.raw, cur)}`
        }
      }
    },
    scales: {
      x: { grid: { color: '#252840' }, ticks: { color: '#9094b0' } },
      y: { grid: { color: '#252840' }, ticks: { color: '#9094b0', callback: v => '$' + v.toLocaleString() } }
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  const budgetPct = budgetData?.budget
    ? Math.min((budgetData.totalSpent / budgetData.budget.totalLimit) * 100, 100)
    : 0;

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
        <Link to="/transactions" className="btn btn-primary">
          + Add Transaction
        </Link>
      </div>

      {/* Alerts */}
      {budgetData?.alerts?.length > 0 && (
        <div className="alerts-row">
          {budgetData.alerts.map((a, i) => (
            <div key={i} className={`alert ${a.severity === 'exceeded' ? 'alert-error' : 'alert-warning'}`}>
              {a.severity === 'exceeded' ? '⚠️' : '🔔'} {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          label="Total Income"
          value={formatCurrency(summary?.income || 0, cur)}
          sub="This month"
          color="var(--accent-green)"
          icon="↑"
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(summary?.expenses || 0, cur)}
          sub="This month"
          color="var(--accent-red)"
          icon="↓"
        />
        <StatCard
          label="Net Balance"
          value={formatCurrency((summary?.income || 0) - (summary?.expenses || 0), cur)}
          sub="This month"
          color={(summary?.income || 0) >= (summary?.expenses || 0) ? 'var(--accent-green)' : 'var(--accent-red)'}
          icon="≈"
        />
        <StatCard
          label="Transactions"
          value={summary?.transactionCount || 0}
          sub="This month"
          color="var(--accent-primary)"
          icon="#"
        />
      </div>

      {/* Charts row */}
      <div className="charts-row">
        <div className="card chart-card chart-bar">
          <div className="card-header">
            <h3 className="card-title">Income vs Expenses</h3>
            <span className="card-meta">{new Date().getFullYear()}</span>
          </div>
          <div className="chart-wrap">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>

        <div className="card chart-card chart-donut">
          <div className="card-header">
            <h3 className="card-title">Expenses by Category</h3>
            <span className="card-meta">This month</span>
          </div>
          {categoryData.length > 0 ? (
            <div className="chart-wrap donut-wrap">
              <Doughnut data={doughnutData} options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '68%',
                plugins: {
                  legend: { position: 'bottom', labels: { color: '#9094b0', padding: 12, font: { family: 'DM Sans', size: 12 } } },
                  tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${formatCurrency(ctx.raw, cur)}` } }
                }
              }} />
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-text">No expenses yet</div>
              <div className="empty-state-sub">Add transactions to see insights</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="bottom-row">
        {/* Recent transactions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Transactions</h3>
            <Link to="/transactions" className="card-link">View all →</Link>
          </div>
          {recentTx.length > 0 ? (
            <div className="tx-list">
              {recentTx.map(tx => (
                <div key={tx._id} className="tx-item">
                  <div className="tx-icon" style={{ background: tx.type === 'income' ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)' }}>
                    {tx.type === 'income' ? '↑' : '↓'}
                  </div>
                  <div className="tx-info">
                    <div className="tx-category">{tx.category}</div>
                    <div className="tx-date">{formatDate(tx.date)}</div>
                  </div>
                  <div className={`tx-amount ${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, cur)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-text">No transactions yet</div>
            </div>
          )}
        </div>

        {/* Budget overview */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Monthly Budget</h3>
            <Link to="/budget" className="card-link">Manage →</Link>
          </div>
          {budgetData?.budget ? (
            <div className="budget-overview">
              <div className="budget-totals">
                <div className="budget-spent">{formatCurrency(budgetData.totalSpent, cur)}</div>
                <div className="budget-limit">of {formatCurrency(budgetData.budget.totalLimit, cur)}</div>
              </div>
              <div className="budget-bar-wrap">
                <div className="budget-bar">
                  <div
                    className={`budget-bar-fill ${budgetPct >= 100 ? 'exceeded' : budgetPct >= 80 ? 'warning' : ''}`}
                    style={{ width: `${budgetPct}%` }}
                  ></div>
                </div>
                <span className="budget-pct">{budgetPct.toFixed(1)}%</span>
              </div>
              {budgetData.budget.categoryLimits?.map(cl => {
                const spent = budgetData.spentByCategory?.[cl.category] || 0;
                const pct = Math.min((spent / cl.limit) * 100, 100);
                return (
                  <div key={cl.category} className="budget-cat-item">
                    <div className="budget-cat-label">
                      <span>{cl.category}</span>
                      <span>{formatCurrency(spent, cur)} / {formatCurrency(cl.limit, cur)}</span>
                    </div>
                    <div className="budget-bar mini">
                      <div
                        className={`budget-bar-fill ${pct >= 100 ? 'exceeded' : pct >= 80 ? 'warning' : ''}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-text">No budget set</div>
              <div className="empty-state-sub">Create a budget to track spending</div>
              <Link to="/budget" className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>Create Budget</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
