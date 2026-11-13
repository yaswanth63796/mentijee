import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Atom, Flame, Calculator, ChevronRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { usePractice } from '../context/PracticeContext';
import Navbar from '../components/Navbar';

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
    <div className="menti-page-wrapper">
      <Navbar />

      <main className="menti-content-container">
        <div className="menti-back-bar">
          <button 
            className="menti-back-btn"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>

        <section className="menti-page-header" style={{ textAlign: 'center', maxWidth: '800px', margin: '1rem auto 2.5rem' }}>
          <h1 className="menti-header-title">
            Master JEE with <span>AI-Powered</span> Question Practice
          </h1>
          <p className="menti-header-desc" style={{ margin: '0 auto' }}>
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
