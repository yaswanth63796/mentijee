import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, Sparkles, CheckCircle2, History, BarChart2, Trophy, ShieldCheck, Zap } from 'lucide-react';
import { usePractice } from '../context/PracticeContext';
import Navbar from '../components/Navbar';

const Home = () => {
  const navigate = useNavigate();
  const { startSession } = usePractice();

  const handleStartPractice = () => {
    startSession();
    navigate('/subjects');
  };

  return (
    <div className="menti-page-wrapper">
      <Navbar />

      <main className="menti-content-container">
        <section className="menti-page-header" style={{ textAlign: 'center', maxWidth: '800px', margin: '2rem auto 2.5rem' }}>
          <div className="menti-header-badge" style={{ margin: '0 auto 1rem' }}>
            <Sparkles size={15} />
            <span>EXCELLENCE IN JEE PREPARATION</span>
          </div>
          <h1 className="menti-header-title" style={{ fontSize: '2.5rem' }}>
            Master JEE with <span>MentiJEE</span>
          </h1>
          <p className="menti-header-desc" style={{ fontSize: '1.05rem', margin: '0 auto' }}>
            Prepare for JEE Main &amp; Advanced with curated multi-subject practice modules, national timed mock challenges, and instant performance analysis.
          </p>
        </section>

        {/* Action Hero Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto 3rem' }}>
          {/* JEE CONTESTS CARD */}
          <div className="menti-contest-card border-live" style={{ padding: '2rem' }}>
            <div className="menti-card-top">
              <span className="menti-badge badge-live">
                <span className="live-pulse" /> LIVE CHALLENGES
              </span>
              <span className="menti-spec-tag">
                <Trophy size={14} /> All-India Ranks
              </span>
            </div>

            <h2 className="menti-card-title" style={{ fontSize: '1.4rem' }}>
              All-India JEE Contests
            </h2>
            <p className="menti-card-desc">
              Compete live with national aspirants in timed 15-question examinations (5 Physics, 5 Chemistry, 5 Mathematics) with real-time WebSocket leaderboards.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1.25rem 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--color-success)" />
                <span>Deterministic ranking with negative marking</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--color-success)" />
                <span>Instant score calculation upon time expiry</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--color-success)" />
                <span>Comprehensive solutions and derivations</span>
              </div>
            </div>

            <button
              className="menti-btn menti-btn-primary ws-full-btn"
              onClick={() => navigate('/contests')}
              style={{ marginTop: 'auto' }}
            >
              Explore JEE Contests <ArrowRight size={16} />
            </button>
          </div>

          {/* JEE PRACTICE SET A CARD */}
          <div className="menti-contest-card" style={{ padding: '2rem' }}>
            <div className="menti-card-top">
              <span className="menti-badge badge-upcoming">
                <Sparkles size={14} /> CURATED SET
              </span>
              <span className="menti-spec-tag">
                <Zap size={14} /> Self-Paced Practice
              </span>
            </div>

            <h2 className="menti-card-title" style={{ fontSize: '1.4rem' }}>
              JEE Practice Set A
            </h2>
            <p className="menti-card-desc">
              Practice JEE-level Physics, Chemistry, and Mathematics questions with instant real-time evaluation, time tracking, and step-by-step solutions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1.25rem 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--color-success)" />
                <span>MCQs (Q1–20) &amp; Numerical questions (Q21–25)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--color-success)" />
                <span>Overall and individual subject time tracking</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--color-success)" />
                <span>Automatic subject chaining &amp; result analytics</span>
              </div>
            </div>

            <button
              className="menti-btn menti-btn-secondary ws-full-btn"
              onClick={handleStartPractice}
              style={{ marginTop: 'auto' }}
            >
              Start Practice Set A <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
