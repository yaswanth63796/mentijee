import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, Sparkles, CheckCircle2, History, BarChart2 } from 'lucide-react';
import { usePractice } from '../context/PracticeContext';

const Home = () => {
  const navigate = useNavigate();
  const { startSession } = usePractice();

  const handleStartPractice = () => {
    startSession();
    navigate('/subjects');
  };

  return (
    <div className="app-container">
      {/* Header / Navbar */}
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

      <main className="dashboard-page">
        <section className="hero-section">
          <h1 className="hero-title">
            JEE <span>Practice Platform</span>
          </h1>
          <p className="hero-subtitle">
            Prepare for JEE Main &amp; Advanced with curated question sets, instant grading, and step-by-step solutions.
          </p>
        </section>

        {/* JEE PRACTICE SET A CARD */}
        <div className="practice-set-wrapper">
          <div className="practice-set-card">
            <div className="set-badge">
              <Sparkles size={16} /> RECOMMENDED PRACTICE
            </div>

            <div className="set-header">
              <div className="set-icon-box">
                <Layers size={32} />
              </div>
              <div>
                <h2 className="set-title">JEE PRACTICE SET A</h2>
                <p className="set-description">
                  Practice JEE-level Physics, Chemistry and Mathematics questions with instant evaluation.
                </p>
              </div>
            </div>

            <div className="set-features">
              <div className="feature-item"><CheckCircle2 size={16} /> Physics</div>
              <div className="feature-item"><CheckCircle2 size={16} /> Chemistry</div>
              <div className="feature-item"><CheckCircle2 size={16} /> Mathematics</div>
            </div>

            <div className="set-footer">
              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
                onClick={handleStartPractice}
              >
                Start Practice <ArrowRight size={20} />
              </button>
            </div>
          </div>

          {/* Quick links */}
          <div className="home-quick-links">
            <button className="quick-link-card" onClick={() => navigate('/history')}>
              <History size={24} />
              <div>
                <div className="quick-link-title">Test History</div>
                <div className="quick-link-sub">View all past attempts</div>
              </div>
              <ArrowRight size={18} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
            </button>
            <button className="quick-link-card" onClick={() => navigate('/performance')}>
              <BarChart2 size={24} />
              <div>
                <div className="quick-link-title">Performance Dashboard</div>
                <div className="quick-link-sub">Charts, trends, analytics</div>
              </div>
              <ArrowRight size={18} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
