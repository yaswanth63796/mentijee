import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Atom, Flame, Calculator, ChevronRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { usePractice } from '../context/PracticeContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { session, setSubject } = usePractice();

  const subjects = [
    {
      id: 2,
      key: 'physics',
      title: 'Physics',
      icon: <Atom size={28} />,
      desc: 'Mechanics, Thermodynamics, Electromagnetism & Modern Physics practice modules.',
    },
    {
      id: 3,
      key: 'chemistry',
      title: 'Chemistry',
      icon: <Flame size={28} />,
      desc: 'Physical, Organic, and Inorganic Chemistry curated JEE problems.',
    },
    {
      id: 4,
      key: 'mathematics',
      title: 'Mathematics',
      icon: <Calculator size={28} />,
      desc: 'Algebra, Calculus, Coordinate Geometry & Trigonometry problem sets.',
    },
  ];

  const handleStartSubject = (subjectId) => {
    setSubject(subjectId);
    navigate(`/practice/${subjectId}`);
  };

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="brand" onClick={() => navigate('/')}>
          <div className="brand-logo">A</div>
          <div className="brand-name">aorta<span>.prep</span></div>
        </div>
        <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back to Sets
        </button>
      </header>

      <main className="dashboard-page">
        <div style={{ marginBottom: '1.5rem' }}>
          <button 
            className="back-link-btn"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        <section className="hero-section">
          <h1 className="hero-title">
            Master JEE with <span>AI-Powered</span> Question Practice
          </h1>
          <p className="hero-subtitle">
            Select a subject to begin your practice session with real-time evaluation and step-by-step solutions.
          </p>
        </section>

        <div className="subjects-grid">
          {subjects.map((sub) => {
            const isCompleted = session?.results?.[sub.key]?.completed;
            return (
              <div key={sub.id} className="subject-card">
                <div>
                  <div className="subject-icon" style={isCompleted ? { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' } : {}}>
                    {isCompleted ? <CheckCircle size={28} /> : sub.icon}
                  </div>
                  <h2 className="subject-title">{sub.title}</h2>
                  <p className="subject-desc">{sub.desc}</p>
                </div>

                <button
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => handleStartSubject(sub.id)}
                >
                  {isCompleted ? 'Re-practice Subject' : 'Start Practice'} <ChevronRight size={18} />
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
