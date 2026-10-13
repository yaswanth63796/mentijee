import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  BarChart2, ArrowLeft, History, Trophy, Clock,
  Target, TrendingUp, Zap, RefreshCw, AlertCircle
} from 'lucide-react';
import { getAnalytics } from '../api/testResultApi';

/* ─── Custom tooltip wrapper ─────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0', fontSize: '0.85rem', fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          {p.name.toLowerCase().includes('time') || p.name.toLowerCase().includes('secs') ? 's' : ''}
        </p>
      ))}
    </div>
  );
};

/* ─── Summary stat card ──────────────────────────────────────── */
const SummaryCard = ({ icon, label, value, sub, color }) => (
  <div className="perf-summary-card">
    <div className="perf-summary-icon" style={{ color }}>{icon}</div>
    <div className="perf-summary-value" style={{ color }}>{value}</div>
    <div className="perf-summary-label">{label}</div>
    {sub && <div className="perf-summary-sub">{sub}</div>}
  </div>
);

/* ─── Chart section wrapper ──────────────────────────────────── */
const ChartSection = ({ title, children }) => (
  <div className="chart-section">
    <h3 className="chart-section-title">{title}</h3>
    <div className="chart-container">
      {children}
    </div>
  </div>
);

/* ─── Format seconds to m:ss ─────────────────────────────────── */
const fmtSecs = (s) => {
  if (!s) return '0m';
  const m = Math.floor(s / 60);
  return `${m}m`;
};

const PerformanceDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const noData = !analytics || analytics.totalTests === 0;

  return (
    <div className="app-container">
      {/* Navbar */}
      <header className="navbar">
        <div className="brand" onClick={() => navigate('/')}>
          <div className="brand-logo">A</div>
          <div className="brand-name">aorta<span>.prep</span></div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => navigate('/history')}
          >
            <History size={16} /> History
          </button>
          <button
            className="btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={16} /> Home
          </button>
        </div>
      </header>

      <main className="history-page">
        {/* Page header */}
        <div className="history-header">
          <div>
            <h1 className="history-title">
              <BarChart2 size={28} /> Performance Dashboard
            </h1>
            <p className="history-subtitle">Track your JEE preparation progress over time</p>
          </div>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={fetchAnalytics}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="state-container">
            <div className="spinner" />
            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading analytics...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="state-container">
            <AlertCircle size={48} style={{ color: 'var(--error)' }} />
            <p className="error-text">{error}</p>
            <button className="btn-secondary" onClick={fetchAnalytics}>
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        )}

        {/* No data */}
        {!loading && !error && noData && (
          <div className="state-container">
            <BarChart2 size={48} style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '1.1rem' }}>
              No practice data yet. Complete at least one full practice session to see your analytics.
            </p>
            <button className="btn-primary" onClick={() => navigate('/')}>Start Practice</button>
          </div>
        )}

        {/* Dashboard content */}
        {!loading && !error && analytics && analytics.totalTests > 0 && (
          <>
            {/* ── Summary Cards ───────────────────────────────────── */}
            <div className="perf-summary-grid">
              <SummaryCard
                icon={<Trophy size={24} />}
                label="Total Tests"
                value={analytics.totalTests}
                color="var(--primary)"
              />
              <SummaryCard
                icon={<TrendingUp size={24} />}
                label="Latest Score"
                value={`${analytics.latestScore} / ${analytics.scoreProgress?.slice(-1)[0]?.maxMarks || 300}`}
                sub={`${analytics.scoreProgress?.slice(-1)[0]?.percentage?.toFixed(1) || 0}%`}
                color="var(--accent-cyan)"
              />
              <SummaryCard
                icon={<Trophy size={24} />}
                label="Best Score"
                value={analytics.bestScore}
                color="#f59e0b"
              />
              <SummaryCard
                icon={<BarChart2 size={24} />}
                label="Avg Score"
                value={analytics.averageScore?.toFixed(1)}
                color="var(--accent-purple)"
              />
              <SummaryCard
                icon={<Target size={24} />}
                label="Latest Accuracy"
                value={`${analytics.latestAccuracy?.toFixed(1)}%`}
                color="var(--success)"
              />
              <SummaryCard
                icon={<Zap size={24} />}
                label="Avg Accuracy"
                value={`${analytics.averageAccuracy?.toFixed(1)}%`}
                color="#10b981"
              />
              <SummaryCard
                icon={<Clock size={24} />}
                label="Avg Time"
                value={fmtSecs(analytics.averageTimeSecs)}
                color="var(--accent-cyan)"
              />
              <SummaryCard
                icon={<TrendingUp size={24} />}
                label="Strongest"
                value={analytics.strongestSubject}
                color="var(--success)"
              />
              <SummaryCard
                icon={<AlertCircle size={24} />}
                label="Needs Work"
                value={analytics.weakestSubject}
                color="var(--error)"
              />
            </div>

            {/* ── Overall Score Progress ───────────────────────────── */}
            <ChartSection title="📈 Overall Score Progress">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={analytics.scoreProgress} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} domain={[0, 'auto']} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '0.85rem' }} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Score"
                    stroke="#eb4444"
                    strokeWidth={2.5}
                    dot={{ fill: '#eb4444', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    name="Percentage %"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ fill: '#38bdf8', r: 3 }}
                    strokeDasharray="5 3"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartSection>

            {/* ── Subject-wise Performance ─────────────────────────── */}
            <ChartSection title="📚 Subject-wise Performance (%)">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={analytics.subjectProgress} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} domain={[0, 100]} unit="%" />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '0.85rem' }} />
                  <Line type="monotone" dataKey="physicsPercent" name="Physics" stroke="#38bdf8" strokeWidth={2.5} dot={{ fill: '#38bdf8', r: 4 }} />
                  <Line type="monotone" dataKey="chemistryPercent" name="Chemistry" stroke="#a855f7" strokeWidth={2.5} dot={{ fill: '#a855f7', r: 4 }} />
                  <Line type="monotone" dataKey="mathsPercent" name="Mathematics" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartSection>

            {/* ── Time Management ──────────────────────────────────── */}
            <ChartSection title="⏱ Time Management (seconds per subject)">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analytics.timeProgress} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} unit="s" />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '0.85rem' }} />
                  <Bar dataKey="physicsSecs" name="Physics" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="chemistrySecs" name="Chemistry" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="mathsSecs" name="Mathematics" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartSection>

            {/* ── Accuracy Trend ───────────────────────────────────── */}
            <ChartSection title="🎯 Accuracy Trend (%)">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={analytics.accuracyProgress} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} domain={[0, 100]} unit="%" />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    name="Accuracy %"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartSection>
          </>
        )}
      </main>
    </div>
  );
};

export default PerformanceDashboard;
