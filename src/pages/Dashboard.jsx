import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Atom, Flame, Calculator, Sparkles, ChevronRight } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  const subjects = [
    {
      id: 1,
      title: 'Physics',
      icon: <Atom size={28} />,
      desc: 'Mechanics, Thermodynamics, Electromagnetism & Modern Physics practice modules.',
    },
    {
      id: 2,
      title: 'Chemistry',
      icon: <Flame size={28} />,
      desc: 'Physical, Organic, and Inorganic Chemistry curated JEE problems.',
    },
    {
      id: 3,
      title: 'Mathematics',
      icon: <Calculator size={28} />,
      desc: 'Algebra, Calculus, Coordinate Geometry & Trigonometry problem sets.',
    },
  ];

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="brand" onClick={() => navigate('/')}>
          <div className="brand-logo">A</div>
          <div className="brand-name">aorta<span>.prep</span></div>
        </div>
      </header>

      <main className="dashboard-page">
        <section className="hero-section">
          <h1 className="hero-title">
            Master JEE with <span>AI-Powered</span> Question Practice
          </h1>
          <p className="hero-subtitle">
            Select a subject to begin your practice session with real-time evaluation and step-by-step solutions.
          </p>
        </section>

        <div className="subjects-grid">
          {subjects.map((sub) => (
            <div key={sub.id} className="subject-card">
              <div>
                <div className="subject-icon">{sub.icon}</div>
                <h2 className="subject-title">{sub.title}</h2>
                <p className="subject-desc">{sub.desc}</p>
              </div>

              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate(`/practice/${sub.id}`)}
              >
                Start Practice <ChevronRight size={18} />
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
