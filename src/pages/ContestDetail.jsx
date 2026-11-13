import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy, Calendar, Clock, Award, Shield, CheckCircle2,
  AlertCircle, ArrowRight, ArrowLeft, BookOpen, User, Mail,
  Atom, Flame, Calculator, CheckSquare, Info, AlertTriangle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { getContestDetails, joinContest } from '../api/contestApi';

const ContestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [participantName, setParticipantName] = useState(() => {
    try {
      const u = localStorage.getItem('mentijee_user');
      if (u) return JSON.parse(u).name || '';
      return localStorage.getItem('mentijee_student_name') || '';
    } catch (e) {
      return '';
    }
  });

  const [participantEmail, setParticipantEmail] = useState(() => {
    try {
      const u = localStorage.getItem('mentijee_user');
      if (u) return JSON.parse(u).email || '';
      return localStorage.getItem('mentijee_student_email') || '';
    } catch (e) {
      return '';
    }
  });

  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getContestDetails(id);
        setContest(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load contest details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleStartContest = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setError('Please acknowledge that you have read and agreed to the contest examination instructions.');
      return;
    }
    if (!participantName.trim() || !participantEmail.trim()) {
      setError('Please provide your full name and valid email address.');
      return;
    }

    setStarting(true);
    setError('');
    try {
      localStorage.setItem('mentijee_student_name', participantName.trim());
      localStorage.setItem('mentijee_student_email', participantEmail.trim());

      const joinRes = await joinContest(id, {
        participantName: participantName.trim(),
        participantEmail: participantEmail.trim(),
      });

      sessionStorage.setItem(`contest_${id}_session`, joinRes.sessionId);

      if (joinRes.isSubmitted) {
        navigate(`/contests/${id}/result`);
      } else {
        navigate(`/contests/${id}/workspace`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enter contest workspace');
      setStarting(false);
    }
  };

  const formatFullDate = (isoStr) => {
    if (!isoStr) return 'TBA';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="menti-page-wrapper">
        <Navbar />
        <div className="menti-loading-state" style={{ minHeight: '60vh' }}>
          <div className="menti-spinner" />
          <p>Loading contest details...</p>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="menti-page-wrapper">
        <Navbar />
        <div className="menti-content-container">
          <div className="menti-empty-state">
            <AlertCircle size={48} className="menti-empty-icon" style={{ color: 'var(--color-danger)' }} />
            <h3 className="menti-empty-title">Contest Not Found</h3>
            <p className="menti-empty-desc">
              The requested contest does not exist or may have been unlisted.
            </p>
            <button className="menti-btn menti-btn-primary" onClick={() => navigate('/contests')} style={{ marginTop: '1rem' }}>
              <ArrowLeft size={16} /> Return to Contests
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isLive = contest.dynamicState === 'ACTIVE';
  const isUpcoming = contest.dynamicState === 'UPCOMING';
  const isCompleted = contest.dynamicState === 'COMPLETED';

  return (
    <div className="menti-page-wrapper">
      <Navbar />

      <main className="menti-content-container">
        {/* Back Link */}
        <div className="menti-back-bar">
          <button className="menti-back-btn" onClick={() => navigate('/contests')}>
            <ArrowLeft size={16} /> Back to Contests
          </button>
        </div>

        <div className="menti-detail-layout">
          {/* Main Info Card */}
          <div className="menti-detail-card">
            {/* Header */}
            <div className="menti-detail-header">
              <div className="menti-detail-badge-row">
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
                  <Award size={14} /> National Benchmark Exam
                </span>
              </div>

              <h1 className="menti-detail-title">{contest.title}</h1>
              <p className="menti-detail-desc">{contest.description}</p>
            </div>

            {error && (
              <div className="menti-alert menti-alert-error" style={{ marginBottom: '1.5rem' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Specs Grid */}
            <div className="menti-specs-grid">
              <div className="menti-spec-box">
                <Calendar size={20} className="spec-icon" />
                <div>
                  <div className="spec-label">Start Time</div>
                  <div className="spec-val">{formatFullDate(contest.startTime)}</div>
                </div>
              </div>

              <div className="menti-spec-box">
                <Clock size={20} className="spec-icon" />
                <div>
                  <div className="spec-label">Duration</div>
                  <div className="spec-val">{contest.durationMinutes} Minutes</div>
                </div>
              </div>

              <div className="menti-spec-box">
                <Award size={20} className="spec-icon" />
                <div>
                  <div className="spec-label">Questions & Marks</div>
                  <div className="spec-val">15 Questions · {contest.maxMarks || 60} Marks</div>
                </div>
              </div>
            </div>

            {/* Section 1: Subject & Topic Distribution */}
            <section className="menti-section-block">
              <h2 className="menti-section-title">Topics Covered (15 Questions Total)</h2>
              <div className="menti-subjects-trio">
                <div className="menti-sub-col phy-col">
                  <div className="menti-sub-col-header">
                    <div className="menti-sub-title-row">
                      <Atom size={18} className="sub-icon phy" />
                      <strong>Physics</strong>
                    </div>
                    <span className="menti-sub-count">5 Questions · 20 Marks</span>
                  </div>
                  <div className="menti-topics-list">
                    {contest.physicsTopics || 'Mechanics, Laws of Motion, Work Energy, Thermodynamics'}
                  </div>
                </div>

                <div className="menti-sub-col chem-col">
                  <div className="menti-sub-col-header">
                    <div className="menti-sub-title-row">
                      <Flame size={18} className="sub-icon chem" />
                      <strong>Chemistry</strong>
                    </div>
                    <span className="menti-sub-count">5 Questions · 20 Marks</span>
                  </div>
                  <div className="menti-topics-list">
                    {contest.chemistryTopics || 'Atomic Structure, Bonding, Thermodynamics, Organic Chemistry'}
                  </div>
                </div>

                <div className="menti-sub-col math-col">
                  <div className="menti-sub-col-header">
                    <div className="menti-sub-title-row">
                      <Calculator size={18} className="sub-icon math" />
                      <strong>Mathematics</strong>
                    </div>
                    <span className="menti-sub-count">5 Questions · 20 Marks</span>
                  </div>
                  <div className="menti-topics-list">
                    {contest.mathematicsTopics || 'Calculus, Vectors & 3D, Matrices, Coordinate Geometry'}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Marking Scheme */}
            <section className="menti-section-block">
              <h2 className="menti-section-title">Examination Marking Scheme</h2>
              <div className="menti-marking-rules">
                <div className="menti-rule-card rule-correct">
                  <div className="rule-badge-num">+{contest.correctMarks || 4}</div>
                  <div className="rule-text">
                    <strong>Correct Answer</strong>
                    <span>Awarded for each correct MCQ or numerical answer.</span>
                  </div>
                </div>

                <div className="menti-rule-card rule-negative">
                  <div className="rule-badge-num">-{contest.negativeMarks || 1}</div>
                  <div className="rule-text">
                    <strong>Incorrect MCQ Answer</strong>
                    <span>Deducted for incorrect Multiple Choice Questions.</span>
                  </div>
                </div>

                <div className="menti-rule-card rule-zero">
                  <div className="rule-badge-num">0</div>
                  <div className="rule-text">
                    <strong>Unattempted / Incorrect Numerical</strong>
                    <span>No penalty for unattempted questions or numerical questions.</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Official Contest Instructions */}
            <section className="menti-section-block">
              <h2 className="menti-section-title">Official Contest Instructions</h2>
              <div className="menti-instructions-box">
                {contest.instructions ? (
                  contest.instructions.split('\n').map((line, idx) => (
                    <p key={idx} className="instruction-item">
                      <CheckCircle2 size={16} className="instruction-check" />
                      <span>{line}</span>
                    </p>
                  ))
                ) : (
                  <>
                    <p className="instruction-item">
                      <CheckCircle2 size={16} className="instruction-check" />
                      <span>The test contains 15 questions divided equally into Physics (1-5), Chemistry (6-10), and Mathematics (11-15).</span>
                    </p>
                    <p className="instruction-item">
                      <CheckCircle2 size={16} className="instruction-check" />
                      <span>The clock will be set at the server. The countdown timer at the top indicates time remaining.</span>
                    </p>
                    <p className="instruction-item">
                      <CheckCircle2 size={16} className="instruction-check" />
                      <span>Answers are saved automatically as you progress. Auto-submission triggers upon time expiry.</span>
                    </p>
                    <p className="instruction-item">
                      <CheckCircle2 size={16} className="instruction-check" />
                      <span>No correct answers or explanations will be displayed until the contest is submitted.</span>
                    </p>
                  </>
                )}
              </div>
            </section>

            {/* Section 4: Participant Entry Form or Status Action */}
            <section className="menti-entry-section">
              {isLive ? (
                <form onSubmit={handleStartContest} className="menti-entry-form">
                  <h3 className="menti-form-title">Enter Contest Session</h3>
                  <p className="menti-form-desc">
                    Confirm your details to generate your unique verified examination session token.
                  </p>

                  <div className="menti-form-grid">
                    <div className="menti-form-group">
                      <label className="menti-label">Student Name *</label>
                      <div className="menti-input-box">
                        <User size={18} className="menti-input-icon" />
                        <input
                          type="text"
                          required
                          value={participantName}
                          onChange={(e) => setParticipantName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="menti-input"
                        />
                      </div>
                    </div>

                    <div className="menti-form-group">
                      <label className="menti-label">Registered Email Address *</label>
                      <div className="menti-input-box">
                        <Mail size={18} className="menti-input-icon" />
                        <input
                          type="email"
                          required
                          value={participantEmail}
                          onChange={(e) => setParticipantEmail(e.target.value)}
                          placeholder="e.g. rahul@example.com"
                          className="menti-input"
                        />
                      </div>
                    </div>
                  </div>

                  <label className="menti-checkbox-label">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="menti-checkbox"
                    />
                    <span>
                      I have read and understood all instructions. I declare that I will attempt the exam fairly without unauthorized assistance.
                    </span>
                  </label>

                  <div className="menti-entry-actions">
                    <button
                      type="submit"
                      disabled={starting}
                      className="menti-btn menti-btn-primary menti-btn-lg"
                    >
                      {starting ? 'Entering Contest Workspace...' : 'Start Contest Now'}
                      <ArrowRight size={18} />
                    </button>
                    <button
                      type="button"
                      className="menti-btn menti-btn-outline"
                      onClick={() => navigate(`/contests/${id}/leaderboard`)}
                    >
                      <Trophy size={16} /> View Live Leaderboard
                    </button>
                  </div>
                </form>
              ) : isUpcoming ? (
                <div className="menti-upcoming-banner">
                  <Calendar size={32} className="upcoming-icon" />
                  <div>
                    <h3 className="upcoming-title">Contest Scheduled to Begin Soon</h3>
                    <p className="upcoming-sub">
                      This contest will activate at <strong>{formatFullDate(contest.startTime)}</strong>. Make sure your browser is ready.
                    </p>
                  </div>
                  <button
                    className="menti-btn menti-btn-outline"
                    onClick={() => navigate(`/contests/${id}/leaderboard`)}
                  >
                    <Trophy size={16} /> Preview Leaderboard
                  </button>
                </div>
              ) : (
                <div className="menti-completed-banner">
                  <CheckCircle2 size={32} className="completed-icon" />
                  <div>
                    <h3 className="completed-title">This Contest Has Concluded</h3>
                    <p className="completed-sub">
                      Submissions are closed. You can view the final verified All-India Leaderboard and rankings.
                    </p>
                  </div>
                  <button
                    className="menti-btn menti-btn-primary"
                    onClick={() => navigate(`/contests/${id}/leaderboard`)}
                  >
                    <Trophy size={16} /> View Final Leaderboard
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContestDetail;
