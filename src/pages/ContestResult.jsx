import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy, Award, CheckCircle2, XCircle, Clock, BarChart2,
  ArrowRight, ArrowLeft, BookOpen, AlertCircle, Sparkles,
  Atom, Flame, Calculator, HelpCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import confetti from 'canvas-confetti';
import Navbar from '../components/Navbar';
import { getContestResult } from '../api/contestApi';

const ContestResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL'); // ALL, PHYSICS, CHEMISTRY, MATHEMATICS

  const sessionId = sessionStorage.getItem(`contest_${id}_session`);

  useEffect(() => {
    const loadResult = async () => {
      try {
        const data = await getContestResult(id, sessionId || '');
        setResult(data);
        if (data.totalScore > 0) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 }
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load examination result');
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [id, sessionId]);

  if (loading) {
    return (
      <div className="menti-page-wrapper">
        <Navbar />
        <div className="menti-loading-state" style={{ minHeight: '60vh' }}>
          <div className="menti-spinner" />
          <p>Analyzing results and calculating All-India percentile...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="menti-page-wrapper">
        <Navbar />
        <div className="menti-content-container">
          <div className="menti-empty-state">
            <AlertCircle size={48} className="menti-empty-icon" style={{ color: 'var(--color-danger)' }} />
            <h3 className="menti-empty-title">No Result Found</h3>
            <p className="menti-empty-desc">
              {error || 'No verified submission was found for this contest session.'}
            </p>
            <button className="menti-btn menti-btn-primary" onClick={() => navigate('/contests')} style={{ marginTop: '1rem' }}>
              <ArrowLeft size={16} /> Return to Contests
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredQuestions = (result.questions || []).filter((q) => {
    if (subjectFilter === 'ALL') return true;
    return q.subjectName?.toLowerCase() === subjectFilter.toLowerCase();
  });

  const subjectChartData = [
    {
      subject: 'Physics',
      score: result.physicsScore || 0,
      max: 20,
    },
    {
      subject: 'Chemistry',
      score: result.chemistryScore || 0,
      max: 20,
    },
    {
      subject: 'Mathematics',
      score: result.mathematicsScore || 0,
      max: 20,
    },
  ];

  return (
    <div className="menti-page-wrapper">
      <Navbar />

      <main className="menti-content-container">
        {/* Navigation Bar */}
        <div className="menti-back-bar">
          <button className="menti-back-btn" onClick={() => navigate('/contests')}>
            <ArrowLeft size={16} /> Contests Catalog
          </button>
          <div className="menti-bar-actions">
            <button
              className="menti-btn menti-btn-primary"
              onClick={() => navigate(`/contests/${id}/leaderboard`)}
            >
              <Trophy size={16} /> View Live Leaderboard
            </button>
          </div>
        </div>

        {/* HERO RESULTS CARD */}
        <section className="results-hero-card">
          <div className="results-hero-top">
            <div>
              <div className="menti-header-badge">
                <Sparkles size={14} />
                <span>OFFICIAL PERFORMANCE REPORT</span>
              </div>
              <h1 className="results-contest-title">{result.contestTitle}</h1>
              <p className="results-contest-sub">
                Aspirant: <strong>{result.participantName}</strong> · Completed in{' '}
                {Math.floor(result.completionTimeSecs / 60)}m {result.completionTimeSecs % 60}s
              </p>
            </div>

            {result.rank > 0 && (
              <div className="results-rank-badge">
                <Trophy size={28} className="trophy-gold" />
                <div className="rank-num">All-India Rank #{result.rank}</div>
              </div>
            )}
          </div>

          {/* Key Metrics Grid */}
          <div className="results-stats-row">
            <div className="res-stat-card primary-stat">
              <div className="res-stat-lbl">Total Score</div>
              <div className="res-stat-val">
                {result.totalScore} <span className="stat-max">/ {result.maxMarks || 60}</span>
              </div>
            </div>

            <div className="res-stat-card">
              <div className="res-stat-lbl">Accuracy</div>
              <div className="res-stat-val" style={{ color: 'var(--brand-blue)' }}>
                {result.accuracyPercent}%
              </div>
            </div>

            <div className="res-stat-card">
              <div className="res-stat-lbl">Correct Answers</div>
              <div className="res-stat-val" style={{ color: 'var(--color-success)' }}>
                {result.totalCorrect} <span className="stat-max">/ 15</span>
              </div>
            </div>

            <div className="res-stat-card">
              <div className="res-stat-lbl">Incorrect Answers</div>
              <div className="res-stat-val" style={{ color: 'var(--color-danger)' }}>
                {result.totalWrong}
              </div>
            </div>

            <div className="res-stat-card">
              <div className="res-stat-lbl">Unattempted</div>
              <div className="res-stat-val" style={{ color: 'var(--text-muted)' }}>
                {result.totalUnanswered}
              </div>
            </div>
          </div>
        </section>

        {/* SUBJECT-WISE PERFORMANCE & CHART */}
        <section className="results-breakdown-section">
          <h2 className="menti-section-title">Subject-Wise Performance Breakdown</h2>

          <div className="res-subject-grid">
            {/* Physics Card */}
            <div className="res-subject-card phy">
              <div className="res-sub-header">
                <div className="res-sub-title">
                  <Atom size={20} className="phy-icon" />
                  <h3>Physics</h3>
                </div>
                <div className="res-sub-score">{result.physicsScore} / 20</div>
              </div>
              <div className="res-sub-stats">
                <div className="stat-line">
                  <span>Correct:</span>
                  <strong>{result.physicsCorrect} / 5</strong>
                </div>
                <div className="stat-line">
                  <span>Attempted:</span>
                  <strong>{result.physicsAttempted} / 5</strong>
                </div>
              </div>
            </div>

            {/* Chemistry Card */}
            <div className="res-subject-card chem">
              <div className="res-sub-header">
                <div className="res-sub-title">
                  <Flame size={20} className="chem-icon" />
                  <h3>Chemistry</h3>
                </div>
                <div className="res-sub-score">{result.chemistryScore} / 20</div>
              </div>
              <div className="res-sub-stats">
                <div className="stat-line">
                  <span>Correct:</span>
                  <strong>{result.chemistryCorrect} / 5</strong>
                </div>
                <div className="stat-line">
                  <span>Attempted:</span>
                  <strong>{result.chemistryAttempted} / 5</strong>
                </div>
              </div>
            </div>

            {/* Mathematics Card */}
            <div className="res-subject-card math">
              <div className="res-sub-header">
                <div className="res-sub-title">
                  <Calculator size={20} className="math-icon" />
                  <h3>Mathematics</h3>
                </div>
                <div className="res-sub-score">{result.mathematicsScore} / 20</div>
              </div>
              <div className="res-sub-stats">
                <div className="stat-line">
                  <span>Correct:</span>
                  <strong>{result.mathematicsCorrect} / 5</strong>
                </div>
                <div className="stat-line">
                  <span>Attempted:</span>
                  <strong>{result.mathematicsAttempted} / 5</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Bar Chart */}
          <div className="res-chart-card">
            <h3 className="res-chart-title">Marks Scored Across Subjects</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="subject" stroke="#64748b" />
                  <YAxis domain={[0, 20]} stroke="#64748b" />
                  <Tooltip
                    formatter={(value) => [`${value} Marks`, 'Score']}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px' }}
                  />
                  <Bar dataKey="score" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* DETAILED STEP-BY-STEP QUESTION SOLUTIONS */}
        <section className="results-solutions-section">
          <div className="solutions-header-bar">
            <div>
              <h2 className="menti-section-title" style={{ margin: 0 }}>
                Step-by-Step Question Review &amp; Solutions
              </h2>
              <p className="solutions-sub">
                Analyze your responses, verify the answer key, and study the step-by-step mathematical derivations.
              </p>
            </div>

            <div className="solutions-filter-tabs">
              <button
                className={`filter-btn ${subjectFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setSubjectFilter('ALL')}
              >
                All (15)
              </button>
              <button
                className={`filter-btn ${subjectFilter === 'Physics' ? 'active' : ''}`}
                onClick={() => setSubjectFilter('Physics')}
              >
                Physics (5)
              </button>
              <button
                className={`filter-btn ${subjectFilter === 'Chemistry' ? 'active' : ''}`}
                onClick={() => setSubjectFilter('Chemistry')}
              >
                Chemistry (5)
              </button>
              <button
                className={`filter-btn ${subjectFilter === 'Mathematics' ? 'active' : ''}`}
                onClick={() => setSubjectFilter('Mathematics')}
              >
                Mathematics (5)
              </button>
            </div>
          </div>

          <div className="solutions-cards-list">
            {filteredQuestions.map((q) => {
              const wasAttempted = q.userSelectedAnswer !== null && q.userSelectedAnswer !== '';
              const isCorrect = q.isCorrect;

              return (
                <div
                  key={q.id}
                  className={`solution-card ${isCorrect ? 'sol-correct' : (wasAttempted ? 'sol-wrong' : 'sol-unanswered')}`}
                >
                  {/* Top Bar */}
                  <div className="sol-top-bar">
                    <div className="sol-chips">
                      <span className="sol-qnum">Question {q.questionOrder}</span>
                      <span className={`sol-subject ${q.subjectName?.toLowerCase()}`}>
                        {q.subjectName}
                      </span>
                      {q.topic && <span className="sol-topic">{q.topic}</span>}
                      <span className="sol-type">{q.questionType}</span>
                    </div>

                    <div className="sol-status-chip">
                      {isCorrect ? (
                        <span className="status-pill-success">
                          <CheckCircle2 size={15} /> Correct (+{q.marksAwarded})
                        </span>
                      ) : wasAttempted ? (
                        <span className="status-pill-danger">
                          <XCircle size={15} /> Incorrect ({q.marksAwarded})
                        </span>
                      ) : (
                        <span className="status-pill-muted">
                          <HelpCircle size={15} /> Unattempted (0)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Statement */}
                  <div className="sol-question-text">{q.questionText}</div>

                  {/* Answers Display */}
                  <div className="sol-answers-grid">
                    <div className="sol-answer-box user-answer">
                      <span className="ans-label">Your Response:</span>
                      <span className={`ans-val ${isCorrect ? 'text-success' : (wasAttempted ? 'text-danger' : 'text-muted')}`}>
                        {wasAttempted ? q.userSelectedAnswer : 'Not Attempted'}
                      </span>
                    </div>

                    <div className="sol-answer-box correct-answer">
                      <span className="ans-label">Correct Answer:</span>
                      <span className="ans-val text-success">
                        {q.correctAnswer}
                      </span>
                    </div>
                  </div>

                  {/* Options if MCQ */}
                  {q.questionType === 'MCQ' && (
                    <div className="sol-options-review">
                      {[
                        { label: 'A', text: q.optionA },
                        { label: 'B', text: q.optionB },
                        { label: 'C', text: q.optionC },
                        { label: 'D', text: q.optionD },
                      ].map((opt) => {
                        const isCorrectOpt = q.correctAnswer === opt.label;
                        const isUserOpt = q.userSelectedAnswer === opt.label;

                        return (
                          <div
                            key={opt.label}
                            className={`sol-opt-row ${isCorrectOpt ? 'is-correct' : (isUserOpt ? 'is-user-wrong' : '')}`}
                          >
                            <span className="opt-lbl">{opt.label}</span>
                            <span className="opt-txt">{opt.text}</span>
                            {isCorrectOpt && <span className="opt-tag tag-correct">Correct Option</span>}
                            {isUserOpt && !isCorrectOpt && <span className="opt-tag tag-wrong">Your Choice</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Step-by-Step Explanation */}
                  {q.explanation && (
                    <div className="sol-explanation-box">
                      <div className="explanation-title">
                        <BookOpen size={16} /> Detailed Step-by-Step Solution &amp; Derivation:
                      </div>
                      <div className="explanation-text">{q.explanation}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ContestResult;
