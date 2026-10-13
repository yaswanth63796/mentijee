import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuestionBySubjectAndNumber, checkAnswer } from '../api/questionApi';
import { saveTestResult } from '../api/testResultApi';
import { usePractice } from '../context/PracticeContext';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Trophy,
  Award,
  Clock,
  Home,
  History,
  Pencil,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const QuestionPractice = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { session, setSubject, completeSubject, finishSession } = usePractice();

  const saveRef = useRef(false); // prevent double save on completion screen

  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [numericalAnswer, setNumericalAnswer] = useState('');
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkingAnswer, setCheckingAnswer] = useState(false);
  const [error, setError] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [subjectCompletionStats, setSubjectCompletionStats] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle'|'saving'|'saved'|'error'

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getSubjectKey = (id) => {
    switch (String(id)) {
      case '2': return 'physics';
      case '3': return 'chemistry';
      case '4': return 'mathematics';
      default: return 'physics';
    }
  };

  const getNextSubjectId = (id) => {
    switch (String(id)) {
      case '2': return '3';
      case '3': return '4';
      default: return null;
    }
  };

  const getSubjectName = (id) => {
    switch (String(id)) {
      case '2': return 'Physics';
      case '3': return 'Chemistry';
      case '4': return 'Mathematics';
      default: return `Subject ${id}`;
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDetailedTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
  };

  // Questions 21-25 are numerical (fill in the blank)
  const isNumerical = currentQuestionNumber >= 21 && currentQuestionNumber <= 25;

  // ── Sync subject to context ───────────────────────────────────────────────

  useEffect(() => {
    if (session.currentSubjectId !== String(subjectId)) {
      setSubject(subjectId);
    }
    setCompleted(false);
    setSubjectCompletionStats(null);
    saveRef.current = false;
  }, [subjectId]);

  // ── Fetch question ────────────────────────────────────────────────────────

  const fetchQuestion = async (number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getQuestionBySubjectAndNumber(subjectId, number);
      setQuestion(data);
    } catch (err) {
      console.error('Failed to fetch question:', err);
      setError('Unable to load question.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!completed) fetchQuestion(currentQuestionNumber);
  }, [subjectId, currentQuestionNumber]);

  // ── Answer handlers ───────────────────────────────────────────────────────

  const handleSelectOption = (optionLabel) => {
    if (answerSubmitted || checkingAnswer) return;
    setSelectedAnswer(optionLabel);
  };

  const handleNumericalChange = (e) => {
    if (answerSubmitted || checkingAnswer) return;
    setNumericalAnswer(e.target.value);
  };

  const handleCheckAnswer = async () => {
    const answerToSubmit = isNumerical ? numericalAnswer.trim() : selectedAnswer;
    if (!answerToSubmit || !question || answerSubmitted || checkingAnswer) return;

    setCheckingAnswer(true);
    setError(null);
    try {
      const result = await checkAnswer(question.id, answerToSubmit);
      setAnswerResult(result);
      setAnswerSubmitted(true);
      if (result.correct) {
        setTotalScore((prev) => prev + (result.score || 0));
        setCorrectCount((prev) => prev + 1);
      } else {
        setWrongCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Failed to check answer:', err);
      setError('Unable to check answer.');
    } finally {
      setCheckingAnswer(false);
    }
  };

  // ── Subject completion ────────────────────────────────────────────────────

  const handleNextQuestion = () => {
    if (answerResult && answerResult.nextQuestion === null) {
      const currentKey = getSubjectKey(subjectId);
      completeSubject(currentKey, totalScore, 100, correctCount, wrongCount);

      setSubjectCompletionStats({
        subjectName: getSubjectName(subjectId),
        score: totalScore,
        totalMarks: 100,
        time: session.subjectTime,
        correctCount,
        wrongCount,
        nextId: getNextSubjectId(subjectId),
      });

      setCompleted(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      return;
    }

    setSelectedAnswer(null);
    setNumericalAnswer('');
    setAnswerSubmitted(false);
    setAnswerResult(null);
    setError(null);
    setCurrentQuestionNumber((prev) => prev + 1);
  };

  // Build the subject results array from context + current completion stats
  const buildSubjectResults = (stats) => {
    const r = session.results || {};
    const list = [];

    // Previously completed subjects (stored in context)
    ['physics', 'chemistry', 'mathematics'].forEach((key) => {
      const subData = r[key];
      if (subData && subData.completed) {
        list.push({
          subjectName: key.charAt(0).toUpperCase() + key.slice(1),
          marksObtained: subData.score,
          maxMarks: subData.totalMarks || 100,
          correct: subData.correct || 0,
          wrong: subData.wrong || 0,
          attempted: (subData.correct || 0) + (subData.wrong || 0),
          timeSecs: subData.time || 0,
        });
      }
    });

    // Add current subject just completed (stats from state, not context yet)
    const currentKey = getSubjectKey(subjectId);
    const alreadyAdded = list.some(s => s.subjectName.toLowerCase() === currentKey);
    if (!alreadyAdded && stats) {
      list.push({
        subjectName: stats.subjectName,
        marksObtained: stats.score,
        maxMarks: stats.totalMarks,
        correct: stats.correctCount,
        wrong: stats.wrongCount,
        attempted: stats.correctCount + stats.wrongCount,
        timeSecs: stats.time,
      });
    }

    return list;
  };

  // Save completed subjects to DB and exit
  const handleSaveAndExit = async (stats) => {
    if (saveRef.current) { navigate('/history'); return; }
    saveRef.current = true;
    setSaveStatus('saving');

    const subjectResults = buildSubjectResults(stats);
    const totalSc = subjectResults.reduce((a, s) => a + s.marksObtained, 0);
    const totalMax = subjectResults.reduce((a, s) => a + s.maxMarks, 0);
    const totalC = subjectResults.reduce((a, s) => a + s.correct, 0);
    const totalW = subjectResults.reduce((a, s) => a + s.wrong, 0);

    const payload = {
      sessionId: session.sessionId + '-partial-' + subjectId,
      testName: 'JEE PRACTICE SET A (Partial)',
      overallTimeSecs: session.overallTime || 0,
      totalScore: totalSc,
      totalMaxMarks: totalMax,
      totalCorrect: totalC,
      totalWrong: totalW,
      totalAttempted: totalC + totalW,
      subjectResults,
    };

    try {
      await saveTestResult(payload);
      setSaveStatus('saved');
    } catch (e) {
      console.error('Save failed:', e);
      setSaveStatus('error');
    }

    finishSession();
    navigate('/history');
  };

  // Continue to next subject
  const handleContinueToNext = (stats) => {
    const nextId = stats?.nextId;
    if (nextId) {
      setSubject(nextId);
      navigate(`/practice/${nextId}`);
      setCurrentQuestionNumber(1);
      setTotalScore(0);
      setCorrectCount(0);
      setWrongCount(0);
      setSelectedAnswer(null);
      setNumericalAnswer('');
      setAnswerSubmitted(false);
      setAnswerResult(null);
      setError(null);
      setCompleted(false);
      setSubjectCompletionStats(null);
      saveRef.current = false;
    } else {
      // Mathematics done — go to final results (FinalResult saves all)
      finishSession();
      navigate('/results');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="app-container">
      {/* Navbar */}
      <header className="navbar">
        <div className="brand" onClick={() => navigate('/')}>
          <div className="brand-logo">A</div>
          <div className="brand-name">aorta<span>.prep</span></div>
        </div>

        <div className="timer-badge header-timer">
          <Clock size={16} />
          <span>Overall: {formatTime(session.overallTime)}</span>
        </div>

        <button
          className="btn-secondary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          onClick={() => navigate('/')}
        >
          Dashboard
        </button>
      </header>

      <main className="practice-page">
        {/* ── SUBJECT COMPLETION SCREEN ─────────────────────────────────── */}
        {completed && subjectCompletionStats ? (
          <div className="completion-card">
            <div className="completion-icon">
              <Trophy size={48} />
            </div>

            <h1 className="completion-title">
              {subjectCompletionStats.subjectName} Completed!
            </h1>
            <p className="completion-subtitle">Great work — here's your performance summary</p>

            {/* Score box */}
            <div className="score-display-box" style={{ maxWidth: '480px' }}>
              <div className="score-label">{subjectCompletionStats.subjectName} Score</div>
              <div className="total-score-value">
                {subjectCompletionStats.score}{' '}
                <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
                  / {subjectCompletionStats.totalMarks}
                </span>
              </div>

              <div className="stats-grid">
                <div className="stat-box">
                  <div className="score-label">Time Taken</div>
                  <div className="stat-number" style={{ color: 'var(--accent-cyan)' }}>
                    {formatDetailedTime(subjectCompletionStats.time)}
                  </div>
                </div>
                <div className="stat-box">
                  <div className="score-label">Correct</div>
                  <div className="stat-number" style={{ color: 'var(--success)' }}>
                    {subjectCompletionStats.correctCount} / 25
                  </div>
                </div>
                <div className="stat-box">
                  <div className="score-label">Wrong</div>
                  <div className="stat-number" style={{ color: 'var(--error)' }}>
                    {subjectCompletionStats.wrongCount} / 25
                  </div>
                </div>
                <div className="stat-box">
                  <div className="score-label">Accuracy</div>
                  <div className="stat-number" style={{ color: '#f59e0b' }}>
                    {subjectCompletionStats.correctCount + subjectCompletionStats.wrongCount > 0
                      ? Math.round(
                          (subjectCompletionStats.correctCount /
                            (subjectCompletionStats.correctCount + subjectCompletionStats.wrongCount)) *
                            100
                        )
                      : 0}
                    %
                  </div>
                </div>
              </div>
            </div>

            {/* Choice buttons */}
            <div className="subject-choice-section">
              <p className="subject-choice-label">What would you like to do next?</p>

              <div className="subject-choice-buttons">
                {/* Save and Exit */}
                <button
                  className="subject-choice-btn exit-btn"
                  onClick={() => handleSaveAndExit(subjectCompletionStats)}
                  disabled={saveStatus === 'saving'}
                >
                  <div className="choice-btn-icon">
                    <History size={24} />
                  </div>
                  <div className="choice-btn-content">
                    <div className="choice-btn-title">
                      {saveStatus === 'saving' ? 'Saving...' : 'Save & Exit'}
                    </div>
                    <div className="choice-btn-sub">
                      Save {subjectCompletionStats.subjectName} score to history and exit
                    </div>
                  </div>
                </button>

                {/* Continue to next subject or final */}
                <button
                  className="subject-choice-btn continue-btn"
                  onClick={() => handleContinueToNext(subjectCompletionStats)}
                >
                  <div className="choice-btn-icon">
                    {subjectCompletionStats.nextId ? <ArrowRight size={24} /> : <Trophy size={24} />}
                  </div>
                  <div className="choice-btn-content">
                    <div className="choice-btn-title">
                      {subjectCompletionStats.nextId
                        ? `Continue to ${getSubjectName(subjectCompletionStats.nextId)}`
                        : 'View Final Results'}
                    </div>
                    <div className="choice-btn-sub">
                      {subjectCompletionStats.nextId
                        ? `Start ${getSubjectName(subjectCompletionStats.nextId)} practice`
                        : 'See your complete JEE score'}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ── PROGRESS & STATS BAR ─────────────────────────────────── */}
            <div className="progress-card">
              <div className="progress-header">
                <div className="question-counter">
                  <span>Question {currentQuestionNumber}</span>
                  <span style={{ color: 'var(--text-muted)' }}>/ 25</span>
                  <span className="subject-tag">{getSubjectName(subjectId)}</span>
                  {isNumerical && (
                    <span className="numerical-tag">
                      <Pencil size={12} /> Fill in the Blank
                    </span>
                  )}
                </div>

                <div className="score-stats">
                  <div className="timer-badge subject-timer">
                    <Clock size={16} />
                    <span>{getSubjectName(subjectId)} Time: {formatTime(session.subjectTime)}</span>
                  </div>
                  <div className="stat-item score">
                    <Award size={16} /> Score: {totalScore}
                  </div>
                  <div className="stat-item correct">
                    <CheckCircle2 size={16} /> {correctCount}
                  </div>
                  <div className="stat-item wrong">
                    <XCircle size={16} /> {wrongCount}
                  </div>
                </div>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${(currentQuestionNumber / 25) * 100}%` }}
                />
              </div>
            </div>

            {/* ── LOADING ──────────────────────────────────────────────── */}
            {loading && (
              <div className="state-container">
                <div className="spinner" />
                <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading question...</p>
              </div>
            )}

            {/* ── FETCH ERROR ──────────────────────────────────────────── */}
            {!loading && error && !checkingAnswer && !answerSubmitted && (
              <div className="state-container">
                <XCircle size={48} className="error-text" />
                <p className="error-text">Unable to load question.</p>
                <button className="btn-secondary" onClick={() => fetchQuestion(currentQuestionNumber)}>
                  <RotateCcw size={16} /> Retry
                </button>
              </div>
            )}

            {/* ── QUESTION CARD ────────────────────────────────────────── */}
            {!loading && question && (!error || answerSubmitted) && (
              <div className="question-card">
                <div className="question-meta">
                  <span className={`badge-difficulty ${question.difficulty || 'MEDIUM'}`}>
                    {question.difficulty || 'MEDIUM'}
                  </span>
                  <span className="marks-tag">+{question.marks || 4} Marks</span>
                </div>

                <h2 className="question-text">{question.questionText}</h2>

                {/* ── NUMERICAL INPUT (Q21–Q25) ─────────────────────── */}
                {isNumerical ? (
                  <div className="fitb-container">
                    <div className="fitb-header">
                      <Pencil size={16} />
                      <span>Fill in the Blank</span>
                      <span className="fitb-hint">Enter a numerical value</span>
                    </div>

                    <div className="fitb-input-row">
                      <span className="fitb-answer-label">Answer =</span>
                      <input
                        id="numericalAnswerInput"
                        type="number"
                        step="any"
                        placeholder="0"
                        value={numericalAnswer}
                        onChange={handleNumericalChange}
                        disabled={answerSubmitted || checkingAnswer}
                        autoFocus
                        className={`fitb-input ${
                          answerSubmitted && answerResult
                            ? answerResult.correct
                              ? 'correct-result'
                              : 'wrong-result'
                            : ''
                        }`}
                      />
                      {answerSubmitted && answerResult && (
                        <span className={`fitb-result-icon ${answerResult.correct ? 'correct' : 'wrong'}`}>
                          {answerResult.correct ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                        </span>
                      )}
                    </div>

                    {!answerSubmitted && (
                      <p className="fitb-tip">
                        💡 Tip: Enter only the numerical value (e.g. 42, 3.14, -5)
                      </p>
                    )}
                  </div>
                ) : (
                  /* ── MCQ OPTIONS ─────────────────────────────────── */
                  <div className="options-list">
                    {question.options && question.options.map((opt) => {
                      const isSelected = selectedAnswer === opt.optionLabel;
                      let resultClass = '';
                      if (answerSubmitted && answerResult) {
                        if (answerResult.correct && isSelected) {
                          resultClass = 'correct-result';
                        } else if (!answerResult.correct) {
                          if (isSelected) resultClass = 'wrong-result';
                          else if (answerResult.correctAnswer === opt.optionLabel) resultClass = 'correct-result';
                        }
                      }

                      return (
                        <div
                          key={opt.id || opt.optionLabel}
                          className={`option-card ${isSelected ? 'selected' : ''} ${resultClass} ${
                            answerSubmitted || checkingAnswer ? 'disabled' : ''
                          }`}
                          onClick={() => handleSelectOption(opt.optionLabel)}
                        >
                          <div className="radio-indicator">
                            {isSelected && <div className="radio-inner" />}
                          </div>
                          <span className="option-label">{opt.optionLabel}.</span>
                          <span className="option-text">{opt.optionText}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── RESULT BANNER ─────────────────────────────────── */}
                {answerSubmitted && answerResult && (
                  <div className={`result-banner ${answerResult.correct ? 'success' : 'wrong'}`}>
                    <div className="result-header">
                      {answerResult.correct
                        ? <><CheckCircle2 size={24} /> Correct Answer!</>
                        : <><XCircle size={24} /> Wrong Answer</>}
                    </div>

                    {answerResult.correct ? (
                      <div className="score-gain">+{answerResult.score || 4} Marks earned</div>
                    ) : (
                      <>
                        <div style={{ fontWeight: 700, marginTop: '0.25rem' }}>
                          Correct Answer: <span style={{ color: 'var(--success)' }}>{answerResult.correctAnswer}</span>
                        </div>
                        {answerResult.explanation && (
                          <div className="explanation-card">
                            <div className="explanation-title">Explanation:</div>
                            <div className="explanation-text">{answerResult.explanation}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* ── ANSWER ERROR ─────────────────────────────────── */}
                {error && !checkingAnswer && !answerSubmitted && (
                  <div style={{ color: 'var(--error)', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <XCircle size={18} />
                    <span>Unable to check answer.</span>
                    <button className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }} onClick={handleCheckAnswer}>
                      Try Again
                    </button>
                  </div>
                )}

                {/* ── ACTION BAR ───────────────────────────────────── */}
                <div className="action-bar">
                  {!answerSubmitted ? (
                    <button
                      className="btn-primary"
                      disabled={(isNumerical ? !numericalAnswer.trim() : !selectedAnswer) || checkingAnswer}
                      onClick={handleCheckAnswer}
                    >
                      {checkingAnswer ? (
                        <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Checking...</>
                      ) : isNumerical ? (
                        'Submit Answer'
                      ) : (
                        'Check Answer'
                      )}
                    </button>
                  ) : (
                    <button className="btn-primary" onClick={handleNextQuestion}>
                      {answerResult && answerResult.nextQuestion === null
                        ? `Finish ${getSubjectName(subjectId)}`
                        : 'Next Question'}{' '}
                      <ArrowRight size={18} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default QuestionPractice;
