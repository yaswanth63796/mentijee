import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, Award, ArrowRight, RotateCcw, CheckCircle2 } from 'lucide-react';
import { usePractice } from '../context/PracticeContext';
import confetti from 'canvas-confetti';

const FinalResult = () => {
  const navigate = useNavigate();
  const { session, startSession } = usePractice();

  const results = session?.results || {};
  const physics = results.physics || { score: 0, totalMarks: 100, time: 0 };
  const chemistry = results.chemistry || { score: 0, totalMarks: 100, time: 0 };
  const mathematics = results.mathematics || { score: 0, totalMarks: 100, time: 0 };

  const totalScore = physics.score + chemistry.score + mathematics.score;
  const totalMarks = (physics.totalMarks || 100) + (chemistry.totalMarks || 100) + (mathematics.totalMarks || 100);
  const totalTime = session.overallTime || (physics.time + chemistry.time + mathematics.time);

  const formatDetailedTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
    }
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
  };

  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 }
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
      </header>

      <main className="practice-page">
        <div className="completion-card">
          <div className="completion-icon">
            <Trophy size={48} />
          </div>

          <h1 className="completion-title">JEE PRACTICE SET A</h1>
          <p className="completion-subtitle">
            Practice Session Summary & Performance Analysis
          </p>

          {/* INDIVIDUAL SUBJECT CARDS */}
          <div className="results-subject-grid">
            <div className="subject-result-card">
              <div className="subject-result-title">Physics</div>
              <div className="subject-result-stat">
                <span className="label">Score:</span>
                <span className="value score-val">{physics.score} / {physics.totalMarks || 100}</span>
              </div>
              <div className="subject-result-stat">
                <span className="label">Time:</span>
                <span className="value time-val">{formatDetailedTime(physics.time)}</span>
              </div>
            </div>

            <div className="subject-result-card">
              <div className="subject-result-title">Chemistry</div>
              <div className="subject-result-stat">
                <span className="label">Score:</span>
                <span className="value score-val">{chemistry.score} / {chemistry.totalMarks || 100}</span>
              </div>
              <div className="subject-result-stat">
                <span className="label">Time:</span>
                <span className="value time-val">{formatDetailedTime(chemistry.time)}</span>
              </div>
            </div>

            <div className="subject-result-card">
              <div className="subject-result-title">Mathematics</div>
              <div className="subject-result-stat">
                <span className="label">Score:</span>
                <span className="value score-val">{mathematics.score} / {mathematics.totalMarks || 100}</span>
              </div>
              <div className="subject-result-stat">
                <span className="label">Time:</span>
                <span className="value time-val">{formatDetailedTime(mathematics.time)}</span>
              </div>
            </div>
          </div>

          {/* TOTAL OVERALL SUMMARY BOX */}
          <div className="score-display-box" style={{ maxWidth: '500px', marginTop: '2rem' }}>
            <div className="stats-grid" style={{ borderTop: 'none', paddingTop: 0 }}>
              <div className="stat-box">
                <div className="score-label">Total Score</div>
                <div className="total-score-value" style={{ fontSize: '2.5rem', marginBottom: 0 }}>
                  {totalScore} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/ {totalMarks}</span>
                </div>
              </div>

              <div className="stat-box">
                <div className="score-label">Total Practice Time</div>
                <div className="total-score-value" style={{ fontSize: '2rem', marginBottom: 0, color: 'var(--accent-cyan)' }}>
                  {formatDetailedTime(totalTime)}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
            <button className="btn-secondary" onClick={() => navigate('/')}>
              Back to Home
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
