import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      {/* Header / Navbar */}
      <header className="navbar">
        <div className="brand" onClick={() => navigate('/')}>
          <div className="brand-logo">A</div>
          <div className="brand-name">aorta<span>.prep</span></div>
        </div>
      </header>

      <main className="dashboard-page">
        <section className="hero-section">
          <h1 className="hero-title">
            JEE <span>Practice Platform</span>
          </h1>
          <p className="hero-subtitle">
            Prepare for JEE Main & Advanced with curated question sets, instant grading, and step-by-step solutions.
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
              <div className="feature-item">
                <CheckCircle2 size={16} /> Physics
              </div>
              <div className="feature-item">
                <CheckCircle2 size={16} /> Chemistry
              </div>
              <div className="feature-item">
                <CheckCircle2 size={16} /> Mathematics
              </div>
            </div>

            <div className="set-footer">
              <button 
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
                onClick={() => navigate('/subjects')}
              >
                Start Practice <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
