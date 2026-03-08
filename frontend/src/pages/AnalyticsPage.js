import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatCurrency, getCategoryColor, MONTH_NAMES } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';
import './AnalyticsPage.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement, Filler);

const YEARS = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const cur = user?.currency || 'USD';
  const now = new Date();

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [expCats, setExpCats] = useState([]);
  const [incCats, setIncCats] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportMonth, setExportMonth] = useState(now.getMonth() + 1);
  const [exportYear, setExportYear] = useState(now.getFullYear());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, m, ec, ic, t] = await Promise.all([
          api.get(`/analytics/summary?month=${selectedMonth}&year=${selectedYear}`),
          api.get(`/analytics/monthly?year=${selectedYear}`),
          api.get(`/analytics/by-category?type=expense&month=${selectedMonth}&year=${selectedYear}`),
          api.get(`/analytics/by-category?type=income&month=${selectedMonth}&year=${selectedYear}`),
          api.get('/analytics/trend?months=6'),
        ]);
        setSummary(s.data);
        setMonthly(m.data);
        setExpCats(ec.data);
        setIncCats(ic.data);
        setTrend(t.data);
      } catch (e) {}
      setLoading(false);
    };
    load();
  }, [selectedMonth, selectedYear]);

  const exportCSV = async () => {
    try {
      const res = await api.get(`/export/csv?month=${exportMonth}&year=${exportYear}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `budgetbuddy-${exportYear}-${String(exportMonth).padStart(2,'0')}.csv`;
      a.click();
    } catch (e) {}
  };

  const exportJSON = async () => {
    try {
      const res = await api.get(`/export/json?month=${exportMonth}&year=${exportYear}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `budgetbuddy-${exportYear}-${String(exportMonth).padStart(2,'0')}.json`;
      a.click();
    } catch (e) {}
  };

  const chartDefaults = {
    plugins: {
      legend: { labels: { color: '#9094b0', font: { family: 'DM Sans', size: 12 } } },
      tooltip: { callbacks: { label: ctx => ` ${formatCurrency(ctx.raw, cur)}` } }
    },
    scales: {
      x: { grid: { color: '#252840' }, ticks: { color: '#9094b0' } },
      y: { grid: { color: '#252840' }, ticks: { color: '#9094b0', callback: v => '$' + v.toLocaleString() } }
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  const monthlyBarData = {
    labels: MONTH_NAMES,
    datasets: [
      { label: 'Income', data: monthly.map(m => m.income), backgroundColor: 'rgba(46,204,113,0.7)', borderRadius: 5 },
      { label: 'Expenses', data: monthly.map(m => m.expenses), backgroundColor: 'rgba(231,76,60,0.7)', borderRadius: 5 },
    ]
  };

  const trendLineData = {
    labels: trend.map(t => t.month),
    datasets: [
      {
        label: 'Income', data: trend.map(t => t.income),
        borderColor: '#6c63ff', backgroundColor: 'rgba(108,99,255,0.1)',
        tension: 0.4, fill: true, pointBackgroundColor: '#6c63ff',
      },
      {
        label: 'Expenses', data: trend.map(t => t.expenses),
        borderColor: '#ff6584', backgroundColor: 'rgba(255,101,132,0.1)',
        tension: 0.4, fill: true, pointBackgroundColor: '#ff6584',
      }
    ]
  };

  const expDonut = {
    labels: expCats.slice(0,7).map(c => c.category),
    datasets: [{
      data: expCats.slice(0,7).map(c => c.total),
      backgroundColor: expCats.slice(0,7).map(c => getCategoryColor(c.category)),
      borderWidth: 0,
    }]
  };

  const incDonut = {
    labels: incCats.slice(0,6).map(c => c.category),
    datasets: [{
      data: incCats.slice(0,6).map(c => c.total),
      backgroundColor: incCats.slice(0,6).map(c => getCategoryColor(c.category)),
      borderWidth: 0,
    }]
  };

  const donutOptions = {
    responsive: true, maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'right', labels: { color: '#9094b0', font: { family: 'DM Sans', size: 11 }, padding: 10 } },
      tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${formatCurrency(ctx.raw, cur)}` } }
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Deep insights into your financial health</p>
        </div>
        <div className="period-selector">
          <select className="form-select" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="form-select" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="analytics-summary">
        {[
          { label: 'Income', value: summary?.income || 0, color: 'var(--accent-green)', icon: '↑' },
          { label: 'Expenses', value: summary?.expenses || 0, color: 'var(--accent-red)', icon: '↓' },
          { label: 'Net Balance', value: (summary?.income||0) - (summary?.expenses||0), color: 'var(--accent-primary)', icon: '=' },
          { label: 'Savings Rate', value: summary?.income > 0 ? `${(((summary.income - summary.expenses) / summary.income) * 100).toFixed(1)}%` : '—', color: 'var(--accent-blue)', icon: '%', raw: true },
        ].map(s => (
          <div key={s.label} className="card analytics-stat">
            <div className="as-icon" style={{ color: s.color }}>{s.icon}</div>
            <div className="as-label">{s.label}</div>
            <div className="as-value" style={{ color: s.color }}>
              {s.raw ? s.value : formatCurrency(s.value, cur)}
            </div>
          </div>
        ))}
      </div>

      {/* Trend */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">6-Month Trend</h3>
        </div>
        <div style={{ height: 240 }}>
          <Line data={trendLineData} options={{ ...chartDefaults, scales: { ...chartDefaults.scales } }} />
        </div>
      </div>

      {/* Annual bar */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Annual Overview — {selectedYear}</h3>
        </div>
        <div style={{ height: 240 }}>
          <Bar data={monthlyBarData} options={chartDefaults} />
        </div>
      </div>

      {/* Category breakdown */}
      <div className="analytics-cats-row">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Expenses by Category</h3>
          </div>
          {expCats.length > 0 ? (
            <div style={{ height: 260 }}>
              <Doughnut data={expDonut} options={donutOptions} />
            </div>
          ) : (
            <div className="empty-state"><div className="empty-state-text">No expense data</div></div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Income Sources</h3>
          </div>
          {incCats.length > 0 ? (
            <div style={{ height: 260 }}>
              <Pie data={incDonut} options={{ ...donutOptions, cutout: '0%' }} />
            </div>
          ) : (
            <div className="empty-state"><div className="empty-state-text">No income data</div></div>
          )}
        </div>

        {/* Top expenses */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Expenses</h3>
          </div>
          {expCats.length > 0 ? (
            <div className="top-cats">
              {expCats.slice(0, 6).map((c, i) => {
                const total = expCats.reduce((s, c) => s + c.total, 0);
                const pct = total > 0 ? (c.total / total) * 100 : 0;
                return (
                  <div key={c.category} className="top-cat-item">
                    <div className="top-cat-rank">{i + 1}</div>
                    <div className="top-cat-info">
                      <div className="top-cat-name">{c.category}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <div className="budget-bar mini" style={{ flex: 1 }}>
                          <div className="budget-bar-fill" style={{ width: `${pct}%`, background: getCategoryColor(c.category) }}></div>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 36 }}>{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="top-cat-amount">{formatCurrency(c.total, cur)}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state"><div className="empty-state-text">No data</div></div>
          )}
        </div>
      </div>

      {/* Export */}
      <div className="card export-card">
        <div className="card-header">
          <h3 className="card-title">Export Report</h3>
        </div>
        <div className="export-controls">
          <div className="form-group">
            <label className="form-label">Month</label>
            <select className="form-select" value={exportMonth} onChange={e => setExportMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Year</label>
            <select className="form-select" value={exportYear} onChange={e => setExportYear(Number(e.target.value))}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="export-btns">
            <button className="btn btn-secondary" onClick={exportCSV}>⬇ Export CSV</button>
            <button className="btn btn-secondary" onClick={exportJSON}>⬇ Export JSON</button>
          </div>
        </div>
      </div>
    </div>
  );
}
