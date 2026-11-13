import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock, Flag, ChevronLeft, ChevronRight, CheckCircle2,
  AlertCircle, Send, RotateCcw, AlertTriangle, HelpCircle,
  Atom, Flame, Calculator, ShieldCheck
} from 'lucide-react';
import {
  resumeAttempt, getSafeQuestions, saveAnswer, submitContest
} from '../api/contestApi';

const ContestWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> selectedOption
  const [reviews, setReviews] = useState({}); // questionId -> boolean
  const [remainingSecs, setRemainingSecs] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const sessionId = sessionStorage.getItem(`contest_${id}_session`);
  const timerRef = useRef(null);

  // Auto-submit when time expires
  const handleAutoSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitContest(id, { sessionId, answers });
      sessionStorage.removeItem(`contest_${id}_session`);
      navigate(`/contests/${id}/result`);
    } catch (err) {
      navigate(`/contests/${id}/result`);
    }
  }, [id, sessionId, answers, isSubmitting, navigate]);

  // Load contest attempt & questions
  useEffect(() => {
    if (!sessionId) {
      navigate(`/contests/${id}`);
      return;
    }

    const initWorkspace = async () => {
      try {
        const attempt = await resumeAttempt(id, sessionId);
        if (attempt.isSubmitted) {
          navigate(`/contests/${id}/result`);
          return;
        }

        setRemainingSecs(attempt.remainingSeconds || 0);
        setAnswers(attempt.savedAnswers || {});
        setReviews(attempt.markedForReview || {});

        const qList = await getSafeQuestions(id, sessionId);
        setQuestions(qList || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to initialize examination environment');
      } finally {
        setLoading(false);
      }
    };

    initWorkspace();
  }, [id, sessionId, navigate]);

  // Countdown Timer
  useEffect(() => {
    if (loading || remainingSecs <= 0) return;

    timerRef.current = setInterval(() => {
      setRemainingSecs((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, remainingSecs, handleAutoSubmit]);

  const currentQ = questions[currentIndex];

  // Save answer handler
  const handleSelectAnswer = async (optionVal) => {
    if (!currentQ || !sessionId) return;

    const newAnswers = { ...answers, [currentQ.id]: optionVal };
    setAnswers(newAnswers);

    try {
      await saveAnswer(id, currentQ.id, {
        sessionId,
        selectedOption: optionVal,
        isMarkedForReview: reviews[currentQ.id] || false,
      });
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('expired')) {
        handleAutoSubmit();
      }
    }
  };

  const handleClearAnswer = async () => {
    if (!currentQ || !sessionId) return;

    const newAnswers = { ...answers };
    delete newAnswers[currentQ.id];
    setAnswers(newAnswers);

    try {
      await saveAnswer(id, currentQ.id, {
        sessionId,
        selectedOption: '',
        isMarkedForReview: reviews[currentQ.id] || false,
      });
    } catch (err) {
      // Ignored
    }
  };

  const handleToggleReview = async () => {
    if (!currentQ || !sessionId) return;

    const currentReview = Boolean(reviews[currentQ.id]);
    const nextReview = !currentReview;
    setReviews({ ...reviews, [currentQ.id]: nextReview });

    try {
      await saveAnswer(id, currentQ.id, {
        sessionId,
        selectedOption: answers[currentQ.id] || '',
        isMarkedForReview: nextReview,
      });
    } catch (err) {
      // Ignored
    }
  };

  const handleManualSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitContest(id, { sessionId, answers });
      sessionStorage.removeItem(`contest_${id}_session`);
      navigate(`/contests/${id}/result`);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  // Switch subject group
  const handleSelectSubject = (subjectName) => {
    const firstIdx = questions.findIndex(
      (q) => q.subjectName?.toLowerCase() === subjectName.toLowerCase()
    );
    if (firstIdx !== -1) {
      setCurrentIndex(firstIdx);
    }
  };

  const formatTimer = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  // Status computation for palette
  const getQuestionStatus = (q) => {
    const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
    const isReview = Boolean(reviews[q.id]);

    if (isAnswered && isReview) return 'answered-review';
    if (isReview) return 'review';
    if (isAnswered) return 'answered';
    return 'unanswered';
  };

  const attemptedCount = Object.keys(answers).filter((k) => answers[k] !== '').length;
  const reviewCount = Object.keys(reviews).filter((k) => reviews[k]).length;
  const unansweredCount = Math.max(0, 15 - attemptedCount);

  if (loading) {
    return (
      <div className="menti-page-wrapper">
        <div className="menti-loading-state" style={{ minHeight: '80vh' }}>
          <div className="menti-spinner" />
          <p>Configuring secure exam workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="menti-page-wrapper">
        <div className="menti-content-container">
          <div className="menti-empty-state">
            <AlertCircle size={48} className="menti-empty-icon" style={{ color: 'var(--color-danger)' }} />
            <h3 className="menti-empty-title">{error}</h3>
            <button className="menti-btn menti-btn-primary" onClick={() => navigate('/contests')} style={{ marginTop: '1rem' }}>
              Return to Contests
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentSubject = currentQ?.subjectName || 'Physics';

  return (
    <div className="workspace-screen">
      {/* Exam Header */}
      <header className="workspace-navbar">
        <div className="workspace-brand">
          <div className="workspace-logo-badge">M</div>
          <div>
            <div className="workspace-brand-title">MentiJEE Examination Console</div>
            <div className="workspace-brand-sub">National Timed Challenge · 15 Questions</div>
          </div>
        </div>

        {/* Subject Nav Tabs */}
        <div className="workspace-subject-tabs">
          <button
            className={`ws-tab-btn ${currentSubject.toLowerCase() === 'physics' ? 'active phy' : ''}`}
            onClick={() => handleSelectSubject('Physics')}
          >
            <Atom size={15} /> Physics (Q1–5)
          </button>
          <button
            className={`ws-tab-btn ${currentSubject.toLowerCase() === 'chemistry' ? 'active chem' : ''}`}
            onClick={() => handleSelectSubject('Chemistry')}
          >
            <Flame size={15} /> Chemistry (Q6–10)
          </button>
          <button
            className={`ws-tab-btn ${currentSubject.toLowerCase() === 'mathematics' ? 'active math' : ''}`}
            onClick={() => handleSelectSubject('Mathematics')}
          >
            <Calculator size={15} /> Mathematics (Q11–15)
          </button>
        </div>

        {/* Right Timer & Submit */}
        <div className="workspace-header-actions">
          <div className={`workspace-timer-card ${remainingSecs < 300 ? 'urgent' : ''}`}>
            <Clock size={18} />
            <span className="ws-timer-digits">{formatTimer(remainingSecs)}</span>
          </div>

          <button
            className="menti-btn menti-btn-primary ws-submit-btn"
            onClick={() => setShowSubmitModal(true)}
          >
            <Send size={15} /> Submit Exam
          </button>
        </div>
      </header>

      {/* Main Workspace Workspace Layout */}
      <div className="workspace-main-container">
        {/* Left: Question Area */}
        <main className="workspace-question-pane">
          {currentQ ? (
            <div className="workspace-q-card">
              {/* Question Header */}
              <div className="ws-q-top-row">
                <div className="ws-q-badge-group">
                  <span className="ws-q-num-chip">Question {currentIndex + 1} of 15</span>
                  <span className={`ws-q-subject-chip ${currentQ.subjectName?.toLowerCase()}`}>
                    {currentQ.subjectName}
                  </span>
                  <span className="ws-q-type-chip">{currentQ.questionType}</span>
                  <span className={`ws-q-diff-chip ${currentQ.difficulty?.toLowerCase()}`}>
                    {currentQ.difficulty}
                  </span>
                </div>

                <div className="ws-q-marks-chip">
                  <span className="marks-pos">+{currentQ.marks || 4}</span>
                  <span className="marks-sep">/</span>
                  <span className="marks-neg">-{currentQ.negativeMarks || (currentQ.questionType === 'NUMERICAL' ? 0 : 1)}</span>
                </div>
              </div>

              {/* Topic Label */}
              {currentQ.topic && (
                <div className="ws-q-topic-tag">
                  Topic: <strong>{currentQ.topic}</strong>
                </div>
              )}

              {/* Question Text */}
              <div className="ws-q-statement">
                {currentQ.questionText}
              </div>

              {/* Answer Controls: MCQ vs Numerical */}
              <div className="ws-q-input-area">
                {currentQ.questionType === 'MCQ' ? (
                  <div className="ws-mcq-options-container">
                    {[
                      { label: 'A', text: currentQ.optionA },
                      { label: 'B', text: currentQ.optionB },
                      { label: 'C', text: currentQ.optionC },
                      { label: 'D', text: currentQ.optionD },
                    ].map((opt) => {
                      const isSelected = answers[currentQ.id] === opt.label;
                      return (
                        <div
                          key={opt.label}
                          className={`ws-option-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectAnswer(opt.label)}
                        >
                          <div className="ws-option-radio">
                            <span className="ws-option-letter">{opt.label}</span>
                          </div>
                          <div className="ws-option-text">{opt.text}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="ws-numerical-container">
                    <label className="ws-numerical-label">
                      Type your numerical answer below (accepts integers and decimal values):
                    </label>
                    <div className="ws-numerical-input-row">
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 12.5"
                        value={answers[currentQ.id] || ''}
                        onChange={(e) => handleSelectAnswer(e.target.value)}
                        className="ws-numerical-input"
                      />
                    </div>
                    {currentQ.numericalTolerance > 0 && (
                      <div className="ws-tolerance-hint">
                        Allowed Tolerance: ±{currentQ.numericalTolerance}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Navigation & Controls */}
              <div className="ws-bottom-bar">
                <button
                  className={`menti-btn ${reviews[currentQ.id] ? 'menti-btn-purple' : 'menti-btn-outline'}`}
                  onClick={handleToggleReview}
                >
                  <Flag size={15} />
                  {reviews[currentQ.id] ? 'Marked for Review' : 'Mark for Review'}
                </button>

                <button
                  className="menti-btn menti-btn-subtle"
                  onClick={handleClearAnswer}
                >
                  <RotateCcw size={15} /> Clear Response
                </button>

                <div className="ws-nav-actions-right">
                  <button
                    className="menti-btn menti-btn-outline"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => prev - 1)}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>

                  <button
                    className="menti-btn menti-btn-primary"
                    disabled={currentIndex === questions.length - 1}
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                  >
                    Save & Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="menti-empty-state">No question found</div>
          )}
        </main>

        {/* Right: Question Navigation Palette */}
        <aside className="workspace-palette-pane">
          <div className="ws-palette-card">
            <div className="ws-palette-header">
              <h3 className="ws-palette-title">Question Palette</h3>
              <span className="ws-palette-count">15 Questions</span>
            </div>

            {/* Status Legend */}
            <div className="ws-palette-legend">
              <div className="legend-row">
                <div className="legend-item">
                  <span className="legend-chip chip-answered" />
                  <span>Attempted ({attemptedCount})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-chip chip-unanswered" />
                  <span>Unanswered ({unansweredCount})</span>
                </div>
              </div>
              <div className="legend-row">
                <div className="legend-item">
                  <span className="legend-chip chip-review" />
                  <span>Marked for Review ({reviewCount})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-chip chip-current" />
                  <span>Current Question</span>
                </div>
              </div>
            </div>

            {/* Question Bubbles Grid */}
            <div className="ws-palette-grid">
              {questions.map((q, idx) => {
                const status = getQuestionStatus(q);
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    className={`ws-palette-btn status-${status} ${isCurrent ? 'current' : ''}`}
                    onClick={() => setCurrentIndex(idx)}
                    title={`Question ${idx + 1} (${q.subjectName})`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Subject Summary Progress */}
            <div className="ws-palette-summary">
              <div className="summary-title">Subject Progress</div>

              <div className="ws-sub-stat">
                <div className="ws-sub-stat-top">
                  <span>Physics (Q1–5)</span>
                  <span className="count-num">
                    {questions.slice(0, 5).filter((q) => answers[q.id] !== undefined && answers[q.id] !== '').length} / 5
                  </span>
                </div>
                <div className="ws-progress-track">
                  <div
                    className="ws-progress-bar phy"
                    style={{
                      width: `${(questions.slice(0, 5).filter((q) => answers[q.id] !== undefined && answers[q.id] !== '').length / 5) * 100}%`
                    }}
                  />
                </div>
              </div>

              <div className="ws-sub-stat">
                <div className="ws-sub-stat-top">
                  <span>Chemistry (Q6–10)</span>
                  <span className="count-num">
                    {questions.slice(5, 10).filter((q) => answers[q.id] !== undefined && answers[q.id] !== '').length} / 5
                  </span>
                </div>
                <div className="ws-progress-track">
                  <div
                    className="ws-progress-bar chem"
                    style={{
                      width: `${(questions.slice(5, 10).filter((q) => answers[q.id] !== undefined && answers[q.id] !== '').length / 5) * 100}%`
                    }}
                  />
                </div>
              </div>

              <div className="ws-sub-stat">
                <div className="ws-sub-stat-top">
                  <span>Mathematics (Q11–15)</span>
                  <span className="count-num">
                    {questions.slice(10, 15).filter((q) => answers[q.id] !== undefined && answers[q.id] !== '').length} / 5
                  </span>
                </div>
                <div className="ws-progress-track">
                  <div
                    className="ws-progress-bar math"
                    style={{
                      width: `${(questions.slice(10, 15).filter((q) => answers[q.id] !== undefined && answers[q.id] !== '').length / 5) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="ws-palette-footer">
              <button
                className="menti-btn menti-btn-primary ws-full-btn"
                onClick={() => setShowSubmitModal(true)}
              >
                <Send size={16} /> Final Submit Exam
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* CONFIRM SUBMISSION MODAL */}
      {showSubmitModal && (
        <div className="menti-modal-overlay">
          <div className="menti-modal-card">
            <div className="menti-modal-header">
              <h3 className="menti-modal-title">Confirm Exam Submission</h3>
              <button className="menti-modal-close" onClick={() => setShowSubmitModal(false)}>×</button>
            </div>

            <div className="menti-modal-body">
              <p className="modal-desc">
                Review your response statistics before finalizing your test submission.
              </p>

              <div className="modal-stat-grid">
                <div className="modal-stat-box box-success">
                  <div className="modal-stat-val">{attemptedCount}</div>
                  <div className="modal-stat-lbl">Attempted</div>
                </div>
                <div className="modal-stat-box box-muted">
                  <div className="modal-stat-val">{unansweredCount}</div>
                  <div className="modal-stat-lbl">Unanswered</div>
                </div>
                <div className="modal-stat-box box-purple">
                  <div className="modal-stat-val">{reviewCount}</div>
                  <div className="modal-stat-lbl">Marked for Review</div>
                </div>
              </div>

              <div className="modal-warning-note">
                <AlertTriangle size={18} className="warn-icon" />
                <span>
                  Once submitted, your answers are final. Immediate scoring, All-India percentile calculation, and complete solutions will be revealed.
                </span>
              </div>
            </div>

            <div className="menti-modal-footer">
              <button
                className="menti-btn menti-btn-outline"
                onClick={() => setShowSubmitModal(false)}
              >
                Back to Questions
              </button>
              <button
                className="menti-btn menti-btn-primary"
                disabled={isSubmitting}
                onClick={handleManualSubmit}
              >
                {isSubmitting ? 'Evaluating Submission...' : 'Yes, Submit Contest'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContestWorkspace;
