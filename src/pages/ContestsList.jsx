import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Calendar, Clock, Award, ArrowRight,
  Sparkles, CheckCircle2, AlertCircle, BarChart2,
  Atom, Flame, Calculator, ShieldCheck, Zap
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { getPublishedContests } from '../api/contestApi';

const ContestsList = () => {
  const navigate = useNavigate();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, UPCOMING, COMPLETED

  useEffect(() => {
    const loadContests = async () => {
      try {
        const data = await getPublishedContests();
        setContests(data || []);
      } catch (err) {
        setError('Failed to load contests. Please ensure the backend server is active.');
      } finally {
        setLoading(false);
      }
    };
    loadContests();
  }, []);

  const liveCount = contests.filter((c) => c.dynamicState === 'ACTIVE').length;
  const upcomingCount = contests.filter((c) => c.dynamicState === 'UPCOMING').length;
  const completedCount = contests.filter((c) => c.dynamicState === 'COMPLETED').length;

  const filteredContests = contests.filter((c) => {
    if (activeTab === 'ACTIVE') return c.dynamicState === 'ACTIVE';
    if (activeTab === 'UPCOMING') return c.dynamicState === 'UPCOMING';
    if (activeTab === 'COMPLETED') return c.dynamicState === 'COMPLETED';
    return true;
  });

  const formatScheduleDate = (isoStr) => {
    if (!isoStr) return 'TBA';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="menti-page-wrapper">
      <Navbar />

      <main className="menti-content-container">
        {/* Page Header */}
        <section className="menti-page-header">
          <div className="menti-header-badge">
            <Trophy size={15} />
            <span>ALL-INDIA MOCK EXAMINATIONS</span>
          </div>
          <h1 className="menti-header-title">JEE Contests</h1>
          <p className="menti-header-desc">
            Compete with students across India in 15-question timed challenges (5 Physics, 5 Chemistry, 5 Mathematics) with instant ranking, detailed step-by-step solutions, and live WebSocket leaderboards.
          </p>

          {/* Quick Metrics Bar */}
          <div className="menti-highlights-row">
            <div className="menti-highlight-card">
              <ShieldCheck size={20} className="menti-highlight-icon" />
              <div>
                <div className="menti-highlight-val">NTA JEE Standard</div>
                <div className="menti-highlight-sub">+4 Marks / -1 Negative</div>
              </div>
            </div>
            <div className="menti-highlight-card">
              <Zap size={20} className="menti-highlight-icon" />
              <div>
                <div className="menti-highlight-val">15 Timed Questions</div>
                <div className="menti-highlight-sub">5 Phy · 5 Chem · 5 Math</div>
              </div>
            </div>
            <div className="menti-highlight-card">
              <BarChart2 size={20} className="menti-highlight-icon" />
              <div>
                <div className="menti-highlight-val">Live Leaderboard</div>
                <div className="menti-highlight-sub">Real-Time WebSocket Rank</div>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Filters */}
        <div className="menti-tabs-bar">
          <div className="menti-tabs-group">
            <button
              className={`menti-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              All Contests ({contests.length})
            </button>
            <button
              className={`menti-tab-btn ${activeTab === 'ACTIVE' ? 'active' : ''}`}
              onClick={() => setActiveTab('ACTIVE')}
            >
              <span className="live-dot-indicator" />
              Live Now ({liveCount})
            </button>
            <button
              className={`menti-tab-btn ${activeTab === 'UPCOMING' ? 'active' : ''}`}
              onClick={() => setActiveTab('UPCOMING')}
            >
              Upcoming ({upcomingCount})
            </button>
            <button
              className={`menti-tab-btn ${activeTab === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => setActiveTab('COMPLETED')}
            >
              Past Contests ({completedCount})
            </button>
          </div>
        </div>

        {error && (
          <div className="menti-alert menti-alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Contest Cards Grid */}
        {loading ? (
          <div className="menti-loading-state">
            <div className="menti-spinner" />
            <p>Loading contests from server...</p>
          </div>
        ) : filteredContests.length === 0 ? (
          <div className="menti-empty-state">
            <Trophy size={48} className="menti-empty-icon" />
            <h3 className="menti-empty-title">
              No {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} contests available
            </h3>
            <p className="menti-empty-desc">
              Please check back soon for upcoming JEE mock contests or view past contests.
            </p>
          </div>
        ) : (
          <div className="menti-cards-grid">
            {filteredContests.map((c) => {
              const isLive = c.dynamicState === 'ACTIVE';
              const isUpcoming = c.dynamicState === 'UPCOMING';
              const isCompleted = c.dynamicState === 'COMPLETED';

              return (
                <div
                  key={c.id}
                  className={`menti-contest-card ${isLive ? 'border-live' : ''}`}
                >
                  {/* Card Header */}
                  <div className="menti-card-top">
                    {isLive && (
                      <span className="menti-badge badge-live">
                        <span className="live-pulse" /> LIVE NOW
                      </span>
                    )}
                    {isUpcoming && (
                      <span className="menti-badge badge-upcoming">
                        <Calendar size={13} /> UPCOMING
                      </span>
                    )}
                    {isCompleted && (
                      <span className="menti-badge badge-completed">
                        <CheckCircle2 size={13} /> COMPLETED
                      </span>
                    )}

                    <span className="menti-spec-tag">
                      <Award size={13} /> 15 Questions · {c.maxMarks || 60} Marks
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="menti-card-title">{c.title}</h3>
                  <p className="menti-card-desc">{c.description}</p>

                  {/* Subjects & Topics Covered */}
                  <div className="menti-card-topics-section">
                    <div className="menti-subject-row">
                      <div className="menti-sub-badge phy">
                        <Atom size={13} /> Physics (5 Qs)
                      </div>
                      <span className="menti-sub-topics">
                        {c.physicsTopics || 'Mechanics, Electromagnetism, Thermodynamics'}
                      </span>
                    </div>

                    <div className="menti-subject-row">
                      <div className="menti-sub-badge chem">
                        <Flame size={13} /> Chemistry (5 Qs)
                      </div>
                      <span className="menti-sub-topics">
                        {c.chemistryTopics || 'Physical, Organic & Inorganic Chemistry'}
                      </span>
                    </div>

                    <div className="menti-subject-row">
                      <div className="menti-sub-badge math">
                        <Calculator size={13} /> Mathematics (5 Qs)
                      </div>
                      <span className="menti-sub-topics">
                        {c.mathematicsTopics || 'Calculus, Algebra, Coordinate Geometry'}
                      </span>
                    </div>
                  </div>

                  {/* Schedule Details */}
                  <div className="menti-card-meta-bar">
                    <div className="menti-meta-item">
                      <Calendar size={14} className="meta-icon" />
                      <span>{formatScheduleDate(c.startTime)}</span>
                    </div>
                    <div className="menti-meta-item">
                      <Clock size={14} className="meta-icon" />
                      <span>{c.durationMinutes} Minutes Duration</span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="menti-card-footer">
                    <button
                      className="menti-btn menti-btn-outline"
                      onClick={() => navigate(`/contests/${c.id}/leaderboard`)}
                    >
                      <Trophy size={15} /> Leaderboard
                    </button>

                    {isLive && (
                      <button
                        className="menti-btn menti-btn-primary"
                        onClick={() => navigate(`/contests/${c.id}`)}
                      >
                        Enter Contest <ArrowRight size={15} />
                      </button>
                    )}

                    {isUpcoming && (
                      <button
                        className="menti-btn menti-btn-secondary"
                        onClick={() => navigate(`/contests/${c.id}`)}
                      >
                        Contest Details <ArrowRight size={15} />
                      </button>
                    )}

                    {isCompleted && (
                      <button
                        className="menti-btn menti-btn-secondary"
                        onClick={() => navigate(`/contests/${c.id}`)}
                      >
                        View Summary <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ContestsList;
