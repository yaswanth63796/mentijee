import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Clock, Trophy, CheckCircle2, XCircle,
  Target, BarChart2, History, AlertCircle, RefreshCw
} from 'lucide-react';
import { getTestDetail } from '../api/testResultApi';

const TestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTestDetail(id);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load test details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [id]);

  const formatTime = (secs) => {
    if (!secs) return '0m 0s';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    return `${m}m ${String(s).padStart(2, '0')}s`;
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getSubjectColor = (name) => {
    if (name === 'Physics') return '#38bdf8';
    if (name === 'Chemistry') return '#a855f7';
    return '#10b981';
  };

  const getScoreColor = (score, max) => {
    const pct = max > 0 ? (score / max) * 100 : 0;
    if (pct >= 70) return 'var(--success)';
    if (pct >= 40) return '#f59e0b';
    return 'var(--error)';
  };

  return (
    <div className="app-container">
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
            onClick={() => navigate('/performance')}
          >
            <BarChart2 size={16} /> Performance
          </button>
        </div>
      </header>

      <main className="history-page">
        <div style={{ marginBottom: '1.5rem' }}>
          <button className="back-link-btn" onClick={() => navigate('/history')}>
            <ArrowLeft size={16} /> Back to History
          </button>
        </div>

        {loading && (
          <div className="state-container">
            <div className="spinner" />
            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading result...</p>
          </div>
        )}

        {!loading && error && (
          <div className="state-container">
            <AlertCircle size={48} style={{ color: 'var(--error)' }} />
            <p className="error-text">{error}</p>
            <button className="btn-secondary" onClick={fetchDetail}>
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        )}

        {!loading && !error && result && (
          <>
            {/* Header card */}
            <div className="detail-hero-card">
              <div className="detail-trophy">
                <Trophy size={36} />
              </div>
              <div className="detail-hero-info">
                <h1 className="detail-title">{result.testName}</h1>
                <p className="detail-date">{formatDate(result.completedAt)}</p>
              </div>
              <div className="detail-hero-score">
                <div
                  className="detail-big-score"
                  style={{ color: getScoreColor(result.totalScore, result.totalMaxMarks) }}
                >
                  {result.totalScore}
                  <span className="detail-big-max">/{result.totalMaxMarks}</span>
                </div>
                <div className="detail-big-pct">
                  {result.totalMaxMarks > 0
                    ? Math.round((result.totalScore / result.totalMaxMarks) * 100)
                    : 0}%
                </div>
              </div>
            </div>

            {/* Overall stats row */}
            <div className="detail-stats-row">
              {[
                { icon: <Clock size={20} />, label: 'Total Time', value: formatTime(result.overallTimeSecs), color: 'var(--accent-cyan)' },
                { icon: <CheckCircle2 size={20} />, label: 'Correct', value: result.totalCorrect, color: 'var(--success)' },
                { icon: <XCircle size={20} />, label: 'Wrong', value: result.totalWrong, color: 'var(--error)' },
                { icon: <Target size={20} />, label: 'Accuracy', value: `${result.accuracyPercent?.toFixed(1)}%`, color: '#f59e0b' },
                { icon: <BarChart2 size={20} />, label: 'Attempted', value: result.totalAttempted, color: 'var(--text-main)' },
              ].map(({ icon, label, value, color }) => (
                <div key={label} className="detail-stat-card">
                  <div className="detail-stat-icon" style={{ color }}>{icon}</div>
                  <div className="detail-stat-value" style={{ color }}>{value}</div>
                  <div className="detail-stat-label">{label}</div>
                </div>
              ))}
            </div>

            {/* Subject breakdown */}
            <h2 className="detail-section-title">Subject Breakdown</h2>
            <div className="detail-subjects-grid">
              {(result.subjectResults || []).map((sub) => {
                const pct = sub.maxMarks > 0
                  ? Math.round((sub.marksObtained / sub.maxMarks) * 100)
                  : 0;
                const color = getSubjectColor(sub.subjectName);

                return (
                  <div key={sub.id} className="detail-subject-card" style={{ borderTopColor: color }}>
                    <div className="detail-subject-name" style={{ color }}>{sub.subjectName}</div>

                    {/* Score bar */}
                    <div className="detail-score-bar-wrap">
                      <div className="detail-score-bar-track">
                        <div
                          className="detail-score-bar-fill"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                      <span className="detail-score-pct" style={{ color }}>{pct}%</span>
                    </div>

                    <div className="detail-subject-stats">
                      <div className="detail-sub-stat">
                        <span className="label">Score</span>
                        <span className="value" style={{ color }}>{sub.marksObtained} / {sub.maxMarks}</span>
                      </div>
                      <div className="detail-sub-stat">
                        <span className="label">Correct</span>
                        <span className="value" style={{ color: 'var(--success)' }}>{sub.correct}</span>
                      </div>
                      <div className="detail-sub-stat">
                        <span className="label">Wrong</span>
                        <span className="value" style={{ color: 'var(--error)' }}>{sub.wrong}</span>
                      </div>
                      <div className="detail-sub-stat">
                        <span className="label">Attempted</span>
                        <span className="value">{sub.attempted}</span>
                      </div>
                      <div className="detail-sub-stat">
                        <span className="label">Accuracy</span>
                        <span className="value">{sub.accuracyPercent?.toFixed(1)}%</span>
                      </div>
                      <div className="detail-sub-stat">
                        <span className="label">Time</span>
                        <span className="value" style={{ color: 'var(--accent-cyan)' }}>{formatTime(sub.timeSecs)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default TestDetail;
