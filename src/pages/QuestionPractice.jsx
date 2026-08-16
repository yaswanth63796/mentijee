import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuestionBySubjectAndNumber, checkAnswer } from '../api/questionApi';
import { usePractice } from '../context/PracticeContext';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  Trophy, 
  BookOpen, 
  Sparkles,
  HelpCircle,
  Award,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

const QuestionPractice = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { session, setSubject, completeSubject, finishSession } = usePractice();

  // State requirements from prompt
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

  // Helper: Get subject key for context ('physics', 'chemistry', 'mathematics')
  const getSubjectKey = (id) => {
    switch (String(id)) {
      case '2': return 'physics';
      case '3': return 'chemistry';
      case '4': return 'mathematics';
      default: return 'physics';
    }
  };

  // Helper: Get next subject ID in flow
  const getNextSubjectId = (id) => {
    switch (String(id)) {
      case '2': return '3'; // Physics -> Chemistry
      case '3': return '4'; // Chemistry -> Mathematics
      default: return null; // Mathematics -> Final Result
    }
  };

  // Helper: Format seconds to MM:SS or HH:MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDetailedTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
    }
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
  };

  // Check if current question is numerical (questions 21 to 25)
  const isNumerical = currentQuestionNumber >= 21 && currentQuestionNumber <= 25;

  // Subject Name lookup helper
  const getSubjectName = (id) => {
    switch (String(id)) {
      case '2': return 'Physics';
      case '3': return 'Chemistry';
      case '4': return 'Mathematics';
      default: return `Subject ${id}`;
    }
  };

  // Ensure subject timer is set in practice context when entering
  useEffect(() => {
    if (session.currentSubjectId !== String(subjectId)) {
      setSubject(subjectId);
    }
    setCompleted(false);
    setSubjectCompletionStats(null);
  }, [subjectId]);

  // Fetch question API
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

  // Trigger question fetch when component mounts or subjectId/currentQuestionNumber changes
  useEffect(() => {
    if (!completed) {
      fetchQuestion(currentQuestionNumber);
    }
  }, [subjectId, currentQuestionNumber]);

  // Option selection handler for MCQ
  const handleSelectOption = (optionLabel) => {
    if (answerSubmitted || checkingAnswer) return;
    setSelectedAnswer(optionLabel);
  };

  // Numerical answer input change handler
  const handleNumericalChange = (e) => {
    if (answerSubmitted || checkingAnswer) return;
    setNumericalAnswer(e.target.value);
  };

  // Check Answer Handler
  const handleCheckAnswer = async () => {
    const answerToSubmit = isNumerical ? numericalAnswer.trim() : selectedAnswer;

    if (!answerToSubmit || !question || answerSubmitted || checkingAnswer) return;

    setCheckingAnswer(true);
    setError(null);

    try {
      const result = await checkAnswer(question.id, answerToSubmit);
      setAnswerResult(result);
      setAnswerSubmitted(true);

      // Score logic: Only add score after backend response
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

  // Next Question / Next Subject Handler
  const handleNextQuestion = () => {
    if (answerResult && answerResult.nextQuestion === null) {
      // Last question of this subject completed!
      const currentKey = getSubjectKey(subjectId);
      const timeTaken = session.subjectTime;
      
      // Save subject completion data in context
      completeSubject(currentKey, totalScore, 100);

      // Save local completion stats to display on intermediate subject completion screen
      setSubjectCompletionStats({
        subjectName: getSubjectName(subjectId),
        score: totalScore,
        totalMarks: 100,
        time: timeTaken,
        correctCount,
        wrongCount,
        nextId: getNextSubjectId(subjectId)
      });
      
      setCompleted(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      return;
    }

    // Reset State for Next Question in same subject
    setSelectedAnswer(null);
    setNumericalAnswer('');
    setAnswerSubmitted(false);
    setAnswerResult(null);
    setError(null);
    setCurrentQuestionNumber((prev) => prev + 1);
  };

  // Transition from intermediate subject completion screen to Next Subject or Final Results
  const handleProceedFromCompletion = () => {
    const nextId = subjectCompletionStats?.nextId;
    if (nextId) {
      // Move to next subject (e.g. Physics -> Chemistry or Chemistry -> Mathematics)
      setSubject(nextId);
      navigate(`/practice/${nextId}`);
      // Reset local QuestionPractice component state for new subject
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
    } else {
      // All subjects finished -> Finish session and go to final results
      finishSession();
      navigate('/results');
    }
  };

  return (
    <div className="app-container">
      {/* Header / Navbar */}
      <header className="navbar">
        <div className="brand" onClick={() => navigate('/')}>
          <div className="brand-logo">A</div>
          <div className="brand-name">aorta<span>.prep</span></div>
        </div>

        {/* OVERALL PRACTICE TIMER IN HEADER */}
        <div className="timer-badge header-timer">
          <Clock size={16} />
          <span>Overall: {formatTime(session.overallTime)}</span>
        </div>

        <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => navigate('/')}>
          Dashboard
        </button>
      </header>

      <main className="practice-page">
        {/* INTERMEDIATE SUBJECT COMPLETION SCREEN */}
        {completed && subjectCompletionStats ? (
          <div className="completion-card">
            <div className="completion-icon">
              <Trophy size={48} />
            </div>

            <h1 className="completion-title">{subjectCompletionStats.subjectName} Completed!</h1>
            <p className="completion-subtitle">
              Subject Practice Finished Successfully
            </p>

            <div className="score-display-box" style={{ maxWidth: '440px' }}>
              <div className="score-label">{subjectCompletionStats.subjectName} Score</div>
              <div className="total-score-value">
                {subjectCompletionStats.score} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/ {subjectCompletionStats.totalMarks}</span>
              </div>

              <div className="stats-grid">
                <div className="stat-box">
                  <div className="score-label">Time Taken</div>
                  <div className="stat-number" style={{ color: 'var(--accent-cyan)' }}>
                    {formatDetailedTime(subjectCompletionStats.time)}
                  </div>
                </div>
                <div className="stat-box correct">
                  <div className="score-label">Accuracy</div>
                  <div className="stat-number" style={{ color: 'var(--success)' }}>
                    {subjectCompletionStats.correctCount} / 25
                  </div>
                </div>
              </div>
            </div>

            <button className="btn-primary" onClick={handleProceedFromCompletion} style={{ padding: '1rem 2.5rem' }}>
              {subjectCompletionStats.nextId ? (
                <>
                  Proceed to {getSubjectName(subjectCompletionStats.nextId)} <ArrowRight size={20} />
                </>
              ) : (
                <>
                  View Final Overall Results <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            {/* PROGRESS & STATS TOP BAR */}
            <div className="progress-card">
              <div className="progress-header">
                <div className="question-counter">
                  <span>Question {currentQuestionNumber}</span>
                  <span style={{ color: 'var(--text-muted)' }}>/ 25</span>
                  <span className="subject-tag">{getSubjectName(subjectId)}</span>
                </div>

                {/* SUBJECT TIMER & STATS */}
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
                ></div>
              </div>
            </div>

            {/* LOADING QUESTION STATE */}
            {loading && (
              <div className="state-container">
                <div className="spinner"></div>
                <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading question...</p>
              </div>
            )}

            {/* FETCH ERROR STATE */}
            {!loading && error && !checkingAnswer && !answerSubmitted && (
              <div className="state-container">
                <XCircle size={48} className="error-text" />
                <p className="error-text">Unable to load question.</p>
                <button className="btn-secondary" onClick={() => fetchQuestion(currentQuestionNumber)}>
                  <RotateCcw size={16} /> Retry
                </button>
              </div>
            )}

            {/* QUESTION DISPLAY */}
            {!loading && question && (!error || answerSubmitted) && (
              <div className="question-card">
                <div className="question-meta">
                  <span className={`badge-difficulty ${question.difficulty || 'MEDIUM'}`}>
                    {question.difficulty || 'MEDIUM'}
                  </span>
                  <span className="marks-tag">+{question.marks || 4} Marks</span>
                </div>

                <h2 className="question-text">{question.questionText}</h2>

                {/* QUESTION INPUT UI (MCQ OR NUMERICAL) */}
                {isNumerical ? (
                  /* NUMERICAL INPUT UI (Questions 21 to 25) */
                  <div className="numerical-input-container">
                    <label className="numerical-label" htmlFor="numericalAnswerInput">
                      Enter numerical answer:
                    </label>
                    <input
                      id="numericalAnswerInput"
                      type="number"
                      step="any"
                      placeholder="Type your answer here..."
                      value={numericalAnswer}
                      onChange={handleNumericalChange}
                      disabled={answerSubmitted || checkingAnswer}
                      className={`numerical-input ${
                        answerSubmitted && answerResult
                          ? answerResult.correct
                            ? 'correct-result'
                            : 'wrong-result'
                          : ''
                      }`}
                    />
                  </div>
                ) : (
                  /* MCQ OPTIONS LIST UI (Questions 1 to 20) */
                  <div className="options-list">
                    {question.options && question.options.map((opt) => {
                      const isSelected = selectedAnswer === opt.optionLabel;
                      let resultClass = '';
                      
                      if (answerSubmitted && answerResult) {
                        if (answerResult.correct && isSelected) {
                          resultClass = 'correct-result';
                        } else if (!answerResult.correct) {
                          if (isSelected) {
                            resultClass = 'wrong-result';
                          } else if (answerResult.correctAnswer === opt.optionLabel) {
                            resultClass = 'correct-result';
                          }
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
                            {isSelected && <div className="radio-inner"></div>}
                          </div>
                          <span className="option-label">{opt.optionLabel}.</span>
                          <span className="option-text">{opt.optionText}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ANSWER CHECK RESULT DISPLAY */}
                {answerSubmitted && answerResult && (
                  <div className={`result-banner ${answerResult.correct ? 'success' : 'wrong'}`}>
                    <div className="result-header">
                      {answerResult.correct ? (
                        <>
                          <CheckCircle2 size={24} /> Correct Answer
                        </>
                      ) : (
                        <>
                          <XCircle size={24} /> Wrong Answer
                        </>
                      )}
                    </div>

                    {answerResult.correct ? (
                      <div className="score-gain">+{answerResult.score || 4} Marks</div>
                    ) : (
                      <>
                        <div style={{ fontWeight: 700, marginTop: '0.25rem' }}>
                          Correct Answer: {answerResult.correctAnswer}
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

                {/* ANSWER CHECK ERROR STATE */}
                {error && checkingAnswer === false && answerSubmitted === false && (
                  <div style={{ color: 'var(--error)', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <XCircle size={18} />
                    <span>Unable to check answer.</span>
                    <button className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }} onClick={handleCheckAnswer}>
                      Try Again
                    </button>
                  </div>
                )}

                {/* ACTIONS AREA */}
                <div className="action-bar">
                  {!answerSubmitted ? (
                    <button
                      className="btn-primary"
                      disabled={
                        (isNumerical ? !numericalAnswer.trim() : !selectedAnswer) || checkingAnswer
                      }
                      onClick={handleCheckAnswer}
                    >
                      {checkingAnswer ? (
                        <>
                          <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                          Checking answer...
                        </>
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
