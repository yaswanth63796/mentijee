import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, Award, ArrowRight, RotateCcw, CheckCircle2, History, BarChart2 } from 'lucide-react';
import { usePractice } from '../context/PracticeContext';
import { saveTestResult } from '../api/testResultApi';
import confetti from 'canvas-confetti';

const FinalResult = () => {
  const navigate = useNavigate();
  const { session, startSession } = usePractice();
  const savedRef = useRef(false); // prevent double-save on StrictMode re-renders

  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [savedId, setSavedId] = useState(null);

  const results = session?.results || {};
  const physics = results.physics || { score: 0, totalMarks: 100, time: 0, correct: 0, wrong: 0 };
  const chemistry = results.chemistry || { score: 0, totalMarks: 100, time: 0, correct: 0, wrong: 0 };
  const mathematics = results.mathematics || { score: 0, totalMarks: 100, time: 0, correct: 0, wrong: 0 };

  const totalScore = physics.score + chemistry.score + mathematics.score;
  const totalMarks = (physics.totalMarks || 100) + (chemistry.totalMarks || 100) + (mathematics.totalMarks || 100);
  const totalTime = session.overallTime || (physics.time + chemistry.time + mathematics.time);
  const totalCorrect = (physics.correct || 0) + (chemistry.correct || 0) + (mathematics.correct || 0);
  const totalWrong = (physics.wrong || 0) + (chemistry.wrong || 0) + (mathematics.wrong || 0);

  const formatDetailedTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
  };

  // Save result to DB once on mount
  useEffect(() => {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });

    if (!session?.sessionId || savedRef.current) return;
    savedRef.current = true;

    const payload = {
      sessionId: session.sessionId,
      testName: 'JEE PRACTICE SET A',
      overallTimeSecs: totalTime,
      totalScore,
      totalMaxMarks: totalMarks,
      totalCorrect,
      totalWrong,
      totalAttempted: totalCorrect + totalWrong,
      subjectResults: [
        {
          subjectName: 'Physics',
          marksObtained: physics.score,
          maxMarks: physics.totalMarks || 100,
          correct: physics.correct || 0,
          wrong: physics.wrong || 0,
          attempted: (physics.correct || 0) + (physics.wrong || 0),
          timeSecs: physics.time || 0,
        },
        {
          subjectName: 'Chemistry',
          marksObtained: chemistry.score,
          maxMarks: chemistry.totalMarks || 100,
          correct: chemistry.correct || 0,
          wrong: chemistry.wrong || 0,
          attempted: (chemistry.correct || 0) + (chemistry.wrong || 0),
          timeSecs: chemistry.time || 0,
        },
        {
          subjectName: 'Mathematics',
          marksObtained: mathematics.score,
          maxMarks: mathematics.totalMarks || 100,
          correct: mathematics.correct || 0,
          wrong: mathematics.wrong || 0,
          attempted: (mathematics.correct || 0) + (mathematics.wrong || 0),
          timeSecs: mathematics.time || 0,
        },
      ],
    };

    setSaveStatus('saving');
    saveTestResult(payload)
      .then((saved) => {
        setSaveStatus('saved');
        setSavedId(saved.id);
      })
      .catch((err) => {
        console.error('Failed to save test result:', err);
        setSaveStatus('error');
      });
  }, []);

  const handleRetake = () => {
    startSession();
    navigate('/subjects');
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
            <History size={16} /> Test History
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

      <main className="practice-page">
        <div className="completion-card">
          <div className="completion-icon">
            <Trophy size={48} />
          </div>

          <h1 className="completion-title">JEE PRACTICE SET A</h1>
          <p className="completion-subtitle">Practice Session Summary &amp; Performance Analysis</p>

          {/* Save status badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            {saveStatus === 'saving' && (
              <span className="save-badge saving">⏳ Saving to history...</span>
            )}
            {saveStatus === 'saved' && (
              <span className="save-badge saved" onClick={() => savedId && navigate(`/history/${savedId}`)} style={{ cursor: savedId ? 'pointer' : 'default' }}>
                ✅ Saved to history {savedId ? '— View Detail →' : ''}
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="save-badge error">⚠️ Could not save to history</span>
            )}
          </div>

          {/* Subject result cards */}
          <div className="results-subject-grid">
            {[
              { label: 'Physics', data: physics },
              { label: 'Chemistry', data: chemistry },
              { label: 'Mathematics', data: mathematics },
            ].map(({ label, data }) => (
              <div key={label} className="subject-result-card">
                <div className="subject-result-title">{label}</div>
                <div className="subject-result-stat">
                  <span className="label">Score:</span>
                  <span className="value score-val">{data.score} / {data.totalMarks || 100}</span>
                </div>
                <div className="subject-result-stat">
                  <span className="label">Correct:</span>
                  <span className="value" style={{ color: 'var(--success)' }}>{data.correct || 0}</span>
                </div>
                <div className="subject-result-stat">
                  <span className="label">Wrong:</span>
                  <span className="value" style={{ color: 'var(--error)' }}>{data.wrong || 0}</span>
                </div>
                <div className="subject-result-stat">
                  <span className="label">Time:</span>
                  <span className="value time-val">{formatDetailedTime(data.time)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Total summary box */}
          <div className="score-display-box" style={{ maxWidth: '520px', marginTop: '2rem' }}>
            <div className="stats-grid" style={{ borderTop: 'none', paddingTop: 0 }}>
              <div className="stat-box">
                <div className="score-label">Total Score</div>
                <div className="total-score-value" style={{ fontSize: '2.5rem', marginBottom: 0 }}>
                  {totalScore} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/ {totalMarks}</span>
                </div>
              </div>
              <div className="stat-box">
                <div className="score-label">Total Time</div>
                <div className="total-score-value" style={{ fontSize: '2rem', marginBottom: 0, color: 'var(--accent-cyan)' }}>
                  {formatDetailedTime(totalTime)}
                </div>
              </div>
              <div className="stat-box">
                <div className="score-label">Correct</div>
                <div className="total-score-value" style={{ fontSize: '2rem', marginBottom: 0, color: 'var(--success)' }}>
                  {totalCorrect}
                </div>
              </div>
              <div className="stat-box">
                <div className="score-label">Wrong</div>
                <div className="total-score-value" style={{ fontSize: '2rem', marginBottom: 0, color: 'var(--error)' }}>
                  {totalWrong}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={() => navigate('/')}>Back to Home</button>
            <button className="btn-secondary" onClick={() => navigate('/history')}>
              <History size={18} /> Test History
            </button>
            <button className="btn-secondary" onClick={() => navigate('/performance')}>
              <BarChart2 size={18} /> Performance
            </button>
            <button className="btn-primary" onClick={handleRetake}>
              <RotateCcw size={18} /> Retake Practice Set A
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FinalResult;
