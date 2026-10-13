import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History, ChevronRight, Clock, Trophy, CheckCircle2, XCircle,
  BarChart2, ArrowLeft, AlertCircle, Search, RefreshCw
} from 'lucide-react';
import { getTestHistory } from '../api/testResultApi';

const ITEMS_PER_PAGE = 8;

const TestHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all' | 'today' | 'week'

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTestHistory();
      setHistory(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load test history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatTime = (secs) => {
    if (!secs) return '0m 0s';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
    return `${m}m ${String(s).padStart(2, '0')}s`;
  };

  const getScoreColor = (score, max) => {
    const pct = max > 0 ? (score / max) * 100 : 0;
    if (pct >= 70) return 'var(--success)';
    if (pct >= 40) return '#f59e0b';
    return 'var(--error)';
  };

  // Apply filter
  const filtered = history.filter((t) => {
    if (filter === 'all') return true;
    const d = new Date(t.completedAt);
    const now = new Date();
    if (filter === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (filter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= weekAgo;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

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
            onClick={() => navigate('/performance')}
          >
            <BarChart2 size={16} /> Performance
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
              <History size={28} /> Test History
            </h1>
            <p className="history-subtitle">
              {history.length > 0 ? `${history.length} attempt${history.length !== 1 ? 's' : ''} recorded` : 'No attempts yet'}
            </p>
          </div>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={fetchHistory}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="history-filters">
          {[
            { key: 'all', label: 'All Tests' },
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'This Week' },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => { setFilter(key); setPage(1); }}
            >
              {label}
            </button>
          ))}
          <span className="filter-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* States */}
        {loading && (
          <div className="state-container">
            <div className="spinner" />
            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading history...</p>
          </div>
        )}

        {!loading && error && (
          <div className="state-container">
            <AlertCircle size={48} style={{ color: 'var(--error)' }} />
            <p className="error-text">{error}</p>
            <button className="btn-secondary" onClick={fetchHistory}>
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="state-container">
            <Search size={48} style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '1.1rem' }}>
              {filter === 'all' ? 'No test attempts yet. Complete a practice session to see results here.' : 'No tests found for this filter.'}
            </p>
            <button className="btn-primary" onClick={() => navigate('/')}>Start Practice</button>
          </div>
        )}

        {!loading && !error && paginated.length > 0 && (
          <>
            <div className="history-list">
              {paginated.map((t, idx) => {
                const pct = t.totalMaxMarks > 0
                  ? Math.round((t.totalScore / t.totalMaxMarks) * 100)
                  : 0;
                const phys = t.subjectResults?.find(s => s.subjectName === 'Physics');
                const chem = t.subjectResults?.find(s => s.subjectName === 'Chemistry');
                const math = t.subjectResults?.find(s => s.subjectName === 'Mathematics');

                return (
                  <div
                    key={t.id}
                    className="history-card"
                    onClick={() => navigate(`/history/${t.id}`)}
                  >
                    <div className="history-card-top">
                      <div className="history-card-left">
                        <div className="history-attempt-badge">
                          #{filtered.length - ((page - 1) * ITEMS_PER_PAGE + idx)}
                        </div>
                        <div>
                          <div className="history-test-name">{t.testName}</div>
                          <div className="history-date">{formatDate(t.completedAt)}</div>
                        </div>
                      </div>

                      <div className="history-card-right">
                        <div className="history-score" style={{ color: getScoreColor(t.totalScore, t.totalMaxMarks) }}>
                          {t.totalScore}
                          <span className="history-score-max">/ {t.totalMaxMarks}</span>
                        </div>
                        <div className="history-pct">{pct}%</div>
                      </div>
                    </div>

                    <div className="history-card-stats">
                      <div className="history-stat">
                        <Clock size={14} />
                        {formatTime(t.overallTimeSecs)}
                      </div>
                      <div className="history-stat" style={{ color: 'var(--success)' }}>
                        <CheckCircle2 size={14} />
                        {t.totalCorrect} correct
                      </div>
                      <div className="history-stat" style={{ color: 'var(--error)' }}>
                        <XCircle size={14} />
                        {t.totalWrong} wrong
                      </div>
                      <div className="history-stat" style={{ color: 'var(--accent-cyan)' }}>
                        <Trophy size={14} />
                        {t.accuracyPercent?.toFixed(1)}% acc
                      </div>
                    </div>

                    {/* Subject mini-bars */}
                    <div className="history-subject-bars">
                      {[
                        { label: 'PHY', data: phys, color: '#38bdf8' },
                        { label: 'CHE', data: chem, color: '#a855f7' },
                        { label: 'MAT', data: math, color: '#10b981' },
                      ].map(({ label, data, color }) => {
                        const spct = data && data.maxMarks > 0
                          ? Math.round((data.marksObtained / data.maxMarks) * 100)
                          : 0;
                        return (
                          <div key={label} className="subject-bar-wrap">
                            <span className="subject-bar-label">{label}</span>
                            <div className="subject-bar-track">
                              <div
                                className="subject-bar-fill"
                                style={{ width: `${spct}%`, background: color }}
                              />
                            </div>
                            <span className="subject-bar-pct" style={{ color }}>{spct}%</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="history-card-arrow">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn-secondary"
                  style={{ padding: '0.5rem 1rem' }}
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  ← Prev
                </button>
                <span className="page-info">Page {page} of {totalPages}</span>
                <button
                  className="btn-secondary"
                  style={{ padding: '0.5rem 1rem' }}
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default TestHistory;
