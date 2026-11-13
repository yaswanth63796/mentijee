import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Plus, CheckCircle2, XCircle, AlertTriangle,
  Clock, Calendar, Users, Eye, Edit3, Trash2,
  FileText, Shield, LogOut, ArrowLeft, RefreshCw, BarChart2,
  Atom, Flame, Calculator, Check, AlertCircle, Sparkles, Send
} from 'lucide-react';
import {
  adminGetAllContests, adminCreateContest, adminUpdateContest,
  adminPublishContest, adminCancelContest, adminGetQuestions,
  adminGetAttempts, adminGetTopics, adminAddQuestion,
  adminUpdateQuestion, adminDeleteQuestion, adminSaveAllQuestions
} from '../api/contestApi';
import { useAuth } from '../context/AuthContext';

const AdminContestsDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Topic suggestions from backend
  const [backendTopics, setBackendTopics] = useState({
    Physics: [],
    Chemistry: [],
    Mathematics: []
  });

  // Modal States
  const [showContestModal, setShowContestModal] = useState(false);
  const [editingContest, setEditingContest] = useState(null);

  // Question Management State
  const [activeContestForQuestions, setActiveContestForQuestions] = useState(null);
  const [contestQuestions, setContestQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [activeSubjectTab, setActiveSubjectTab] = useState('Physics'); // Physics, Chemistry, Mathematics

  // Question Form Modal State
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionFormData, setQuestionFormData] = useState({
    subjectName: 'Physics',
    topic: '',
    customTopic: '',
    difficulty: 'MEDIUM',
    questionType: 'MCQ',
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    numericalTolerance: 0.0,
    marks: 4,
    negativeMarks: 1,
    explanation: ''
  });

  // Student Preview Modal State
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [showContestFullPreview, setShowContestFullPreview] = useState(false);

  // Attempts Modal State
  const [showAttemptsModal, setShowAttemptsModal] = useState(false);
  const [selectedContestAttempts, setSelectedContestAttempts] = useState([]);
  const [selectedContestTitle, setSelectedContestTitle] = useState('');

  // Contest Basic Info Form State
  const [contestFormData, setContestFormData] = useState({
    title: '',
    description: '',
    instructions: '1. Each correct answer carries +4 marks.\n2. Each incorrect MCQ answer carries -1 mark.\n3. Numerical questions carry 0 negative marks.\n4. You must complete all 15 questions within the contest duration.\n5. Submissions are final once time expires.',
    startTime: '',
    endTime: '',
    durationMinutes: 60,
    physicsTopics: 'Kinematics, Laws of Motion, Thermodynamics, Electrostatics',
    chemistryTopics: 'Atomic Structure, Chemical Bonding, Coordination Compounds, Organic Chemistry',
    mathematicsTopics: 'Differential Calculus, Integral Calculus, Vectors & 3D, Matrices',
    correctMarks: 4,
    negativeMarks: 1,
  });

  // Load Contests & Topics
  const fetchContests = async () => {
    try {
      setRefreshing(true);
      const data = await adminGetAllContests();
      setContests(data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch contests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const data = await adminGetTopics();
      if (data) {
        setBackendTopics(data);
      }
    } catch (e) {
      console.warn('Could not load topics suggestions', e);
    }
  };

  useEffect(() => {
    fetchContests();
    fetchTopics();
  }, []);

  // Open Create Contest Modal
  const handleOpenCreateContest = () => {
    const now = new Date();
    const start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    start.setMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    const pad = (n) => String(n).padStart(2, '0');
    const formatForInput = (d) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setContestFormData({
      title: 'All-India JEE Premier Challenge #' + (contests.length + 1),
      description: 'Competitive 15-question benchmark examination covering core JEE Main & Advanced syllabus.',
      instructions: '1. Each correct answer carries +4 marks.\n2. Each incorrect MCQ answer carries -1 mark.\n3. Numerical questions carry 0 negative marks.\n4. You must complete all 15 questions within the contest duration.\n5. Submissions are final once time expires.',
      startTime: formatForInput(start),
      endTime: formatForInput(end),
      durationMinutes: 60,
      physicsTopics: 'Kinematics, Laws of Motion, Thermodynamics, Electrostatics',
      chemistryTopics: 'Atomic Structure, Chemical Bonding, Coordination Compounds',
      mathematicsTopics: 'Calculus, Vectors & 3D, Matrices & Determinants',
      correctMarks: 4,
      negativeMarks: 1,
    });
    setEditingContest(null);
    setShowContestModal(true);
  };

  // Open Edit Contest Info Modal
  const handleOpenEditContest = (c) => {
    const pad = (n) => String(n).padStart(2, '0');
    const formatForInput = (dtStr) => {
      if (!dtStr) return '';
      const d = new Date(dtStr);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setContestFormData({
      title: c.title,
      description: c.description || '',
      instructions: c.instructions || '',
      startTime: formatForInput(c.startTime),
      endTime: formatForInput(c.endTime),
      durationMinutes: c.durationMinutes,
      physicsTopics: c.physicsTopics || '',
      chemistryTopics: c.chemistryTopics || '',
      mathematicsTopics: c.mathematicsTopics || '',
      correctMarks: c.correctMarks || 4,
      negativeMarks: c.negativeMarks || 1,
    });
    setEditingContest(c);
    setShowContestModal(true);
  };

  // Save Contest Details (Step 1 & 2)
  const handleSaveContest = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let savedContest;
      if (editingContest) {
        savedContest = await adminUpdateContest(editingContest.id, contestFormData);
        setSuccessMsg('Contest details updated successfully');
      } else {
        savedContest = await adminCreateContest(contestFormData);
        setSuccessMsg('Contest created successfully as Draft. Now add questions below.');
      }
      setShowContestModal(false);
      await fetchContests();

      // Open question management for the newly created / edited contest
      if (!editingContest && savedContest?.id) {
        openQuestionManagement(savedContest);
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save contest');
    }
  };

  // Open Question Management Section
  const openQuestionManagement = async (contest) => {
    setActiveContestForQuestions(contest);
    setActiveSubjectTab('Physics');
    setLoadingQuestions(true);
    try {
      const qList = await adminGetQuestions(contest.id);
      setContestQuestions(qList || []);
    } catch (err) {
      setError('Failed to fetch contest questions');
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Subject-wise question counts
  const physicsQuestions = contestQuestions.filter(
    (q) => q.subjectName?.toLowerCase() === 'physics'
  );
  const chemistryQuestions = contestQuestions.filter(
    (q) => q.subjectName?.toLowerCase() === 'chemistry'
  );
  const mathQuestions = contestQuestions.filter(
    (q) => q.subjectName?.toLowerCase() === 'mathematics'
  );

  const getActiveTabQuestions = () => {
    if (activeSubjectTab === 'Physics') return physicsQuestions;
    if (activeSubjectTab === 'Chemistry') return chemistryQuestions;
    return mathQuestions;
  };

  // Open Add Question Form Modal
  const handleOpenAddQuestion = () => {
    const availableTopics = backendTopics[activeSubjectTab] || [];
    const defaultTopic = availableTopics.length > 0 ? availableTopics[0] : '';

    setQuestionFormData({
      subjectName: activeSubjectTab,
      topic: defaultTopic,
      customTopic: '',
      difficulty: 'MEDIUM',
      questionType: 'MCQ',
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      numericalTolerance: 0.0,
      marks: activeContestForQuestions?.correctMarks || 4,
      negativeMarks: activeContestForQuestions?.negativeMarks || 1,
      explanation: ''
    });
    setEditingQuestion(null);
    setShowQuestionModal(true);
  };

  // Open Edit Question Form Modal
  const handleOpenEditQuestion = (q) => {
    const isMcq = q.questionType === 'MCQ';
    const availableTopics = backendTopics[q.subjectName] || [];
    const isKnownTopic = availableTopics.includes(q.topic);

    setQuestionFormData({
      subjectName: q.subjectName,
      topic: isKnownTopic ? q.topic : (availableTopics.length > 0 ? 'CUSTOM' : ''),
      customTopic: isKnownTopic ? '' : q.topic,
      difficulty: q.difficulty || 'MEDIUM',
      questionType: q.questionType || 'MCQ',
      questionText: q.questionText || '',
      optionA: q.optionA || '',
      optionB: q.optionB || '',
      optionC: q.optionC || '',
      optionD: q.optionD || '',
      correctAnswer: q.correctAnswer || (isMcq ? 'A' : '0'),
      numericalTolerance: q.numericalTolerance || 0.0,
      marks: q.marks || 4,
      negativeMarks: q.negativeMarks !== undefined ? q.negativeMarks : (isMcq ? 1 : 0),
      explanation: q.explanation || ''
    });
    setEditingQuestion(q);
    setShowQuestionModal(true);
  };

  // Save Individual Question (Add or Update)
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    setError('');

    const finalTopic =
      questionFormData.topic === 'CUSTOM' || !questionFormData.topic
        ? questionFormData.customTopic.trim()
        : questionFormData.topic;

    if (!finalTopic) {
      setError('Please select or specify a topic/chapter');
      return;
    }

    if (!questionFormData.questionText.trim()) {
      setError('Question statement cannot be empty');
      return;
    }

    if (questionFormData.questionType === 'MCQ') {
      if (
        !questionFormData.optionA.trim() ||
        !questionFormData.optionB.trim() ||
        !questionFormData.optionC.trim() ||
        !questionFormData.optionD.trim()
      ) {
        setError('Please provide all four options (A, B, C, and D) for MCQ questions');
        return;
      }
      if (!['A', 'B', 'C', 'D'].includes(questionFormData.correctAnswer)) {
        setError('Please select the correct option (A, B, C, or D)');
        return;
      }
    } else {
      if (
        questionFormData.correctAnswer === '' ||
        isNaN(Number(questionFormData.correctAnswer))
      ) {
        setError('Please enter a valid numeric correct answer');
        return;
      }
    }

    const payload = {
      subjectName: questionFormData.subjectName,
      topic: finalTopic,
      difficulty: questionFormData.difficulty,
      questionType: questionFormData.questionType,
      questionText: questionFormData.questionText.trim(),
      optionA: questionFormData.optionA.trim(),
      optionB: questionFormData.optionB.trim(),
      optionC: questionFormData.optionC.trim(),
      optionD: questionFormData.optionD.trim(),
      correctAnswer: questionFormData.correctAnswer.trim(),
      numericalTolerance: Number(questionFormData.numericalTolerance) || 0.0,
      marks: Number(questionFormData.marks) || 4,
      negativeMarks:
        questionFormData.questionType === 'NUMERICAL'
          ? 0
          : Number(questionFormData.negativeMarks) || 0,
      explanation: questionFormData.explanation.trim()
    };

    try {
      if (editingQuestion) {
        await adminUpdateQuestion(
          activeContestForQuestions.id,
          editingQuestion.id,
          payload
        );
        setSuccessMsg('Question updated successfully in database');
      } else {
        await adminAddQuestion(activeContestForQuestions.id, payload);
        setSuccessMsg('Question added and saved directly to database');
      }

      setShowQuestionModal(false);
      // Refresh question list
      const updated = await adminGetQuestions(activeContestForQuestions.id);
      setContestQuestions(updated || []);
      await fetchContests();
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save question to database');
    }
  };

  // Delete Individual Question
  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await adminDeleteQuestion(activeContestForQuestions.id, qId);
      setSuccessMsg('Question deleted successfully');
      const updated = await adminGetQuestions(activeContestForQuestions.id);
      setContestQuestions(updated || []);
      await fetchContests();
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete question');
    }
  };

  // Publish Contest Validation & Action
  const handlePublishContest = async (contestId) => {
    if (
      physicsQuestions.length !== 5 ||
      chemistryQuestions.length !== 5 ||
      mathQuestions.length !== 5
    ) {
      setError(
        `Cannot publish contest. It must have exactly 15 questions (5 Physics, 5 Chemistry, 5 Mathematics). Current counts: Physics: ${physicsQuestions.length}/5, Chemistry: ${chemistryQuestions.length}/5, Mathematics: ${mathQuestions.length}/5.`
      );
      return;
    }

    if (!window.confirm('Are you ready to publish this contest for All-India candidates?')) {
      return;
    }

    try {
      await adminPublishContest(contestId);
      setSuccessMsg('Contest successfully published and made live!');
      await fetchContests();
      if (activeContestForQuestions?.id === contestId) {
        setActiveContestForQuestions(null);
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish contest');
    }
  };

  // Cancel Contest
  const handleCancelContest = async (contestId) => {
    if (!window.confirm('Are you sure you want to cancel this contest?')) return;
    try {
      await adminCancelContest(contestId);
      setSuccessMsg('Contest marked as CANCELLED');
      fetchContests();
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel contest');
    }
  };

  // View Attempts
  const handleViewAttempts = async (contest) => {
    try {
      const data = await adminGetAttempts(contest.id);
      setSelectedContestAttempts(data || []);
      setSelectedContestTitle(contest.title);
      setShowAttemptsModal(true);
    } catch (err) {
      setError('Failed to fetch participant attempts');
    }
  };

  return (
    <div className="menti-admin-wrapper">
      {/* Admin Top Navbar */}
      <header className="menti-admin-navbar">
        <div className="menti-navbar-inner">
          <div className="menti-brand" onClick={() => navigate('/')}>
            <div className="menti-logo-badge">
              <span className="menti-logo-text">M</span>
            </div>
            <div className="menti-brand-details">
              <div className="menti-brand-name">
                Menti<span>JEE</span> Admin
              </div>
              <span className="menti-brand-tag">CONTROL CENTER</span>
            </div>
          </div>

          <div className="menti-nav-actions">
            <button
              className="menti-btn menti-btn-outline"
              onClick={() => navigate('/contests')}
            >
              <ArrowLeft size={16} /> View Student Platform
            </button>

            <button
              className="menti-btn menti-btn-primary"
              onClick={handleOpenCreateContest}
            >
              <Plus size={16} /> Create New Contest
            </button>

            <button
              className="menti-btn menti-btn-subtle"
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
              title="Sign Out"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="menti-admin-content">
        {/* Banner / Header */}
        <div className="menti-admin-page-header">
          <div>
            <div className="menti-header-badge">
              <Shield size={14} />
              <span>DIRECT QUESTION ENTRY CONSOLE</span>
            </div>
            <h1 className="menti-admin-title">JEE Contests &amp; Question Management</h1>
            <p className="menti-admin-desc">
              Author and publish timed JEE contests. Add exactly 15 questions (5 Physics, 5 Chemistry, 5 Mathematics) directly through structured input forms.
            </p>
          </div>

          <button
            className="menti-btn menti-btn-outline"
            onClick={fetchContests}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'menti-spinning' : ''} />
            Refresh
          </button>
        </div>

        {/* Global Alerts */}
        {error && (
          <div className="menti-alert menti-alert-error" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="menti-alert menti-alert-success" style={{ marginBottom: '1.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Stats Summary Cards */}
        <div className="menti-admin-stats-grid">
          <div className="admin-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'var(--brand-blue-light)', color: 'var(--brand-blue)' }}>
              <Trophy size={22} />
            </div>
            <div>
              <div className="admin-stat-val">{contests.length}</div>
              <div className="admin-stat-lbl">Total Contests</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="admin-stat-val">
                {contests.filter((c) => c.status === 'PUBLISHED').length}
              </div>
              <div className="admin-stat-lbl">Published / Active</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
              <Edit3 size={22} />
            </div>
            <div>
              <div className="admin-stat-val">
                {contests.filter((c) => c.status === 'DRAFT').length}
              </div>
              <div className="admin-stat-lbl">Draft Contests</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'var(--color-purple-bg)', color: 'var(--color-purple)' }}>
              <Users size={22} />
            </div>
            <div>
              <div className="admin-stat-val">
                {contests.reduce((acc, c) => acc + (c.participantCount || 0), 0)}
              </div>
              <div className="admin-stat-lbl">Total Participants</div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* DEDICATED QUESTION MANAGEMENT SECTION (WHEN CONTEST SELECTED) */}
        {/* ============================================================== */}
        {activeContestForQuestions && (
          <section className="admin-question-management-section">
            <div className="qm-header-bar">
              <div>
                <div className="qm-context-badge">
                  <Atom size={14} /> ACTIVE CONTEST WORKSPACE
                </div>
                <h2 className="qm-title">{activeContestForQuestions.title}</h2>
                <p className="qm-subtitle">
                  Configure exactly 15 questions (5 Physics, 5 Chemistry, 5 Mathematics). Every question is validated and saved directly to the database.
                </p>
              </div>

              <div className="qm-actions-top">
                <button
                  className="menti-btn menti-btn-outline"
                  onClick={() => setShowContestFullPreview(true)}
                  disabled={contestQuestions.length === 0}
                >
                  <Eye size={16} /> Full Exam Preview ({contestQuestions.length}/15)
                </button>

                <button
                  className="menti-btn menti-btn-primary"
                  onClick={() => handlePublishContest(activeContestForQuestions.id)}
                  disabled={
                    physicsQuestions.length !== 5 ||
                    chemistryQuestions.length !== 5 ||
                    mathQuestions.length !== 5
                  }
                >
                  <Send size={16} /> Publish Contest Live
                </button>

                <button
                  className="menti-btn menti-btn-subtle"
                  onClick={() => setActiveContestForQuestions(null)}
                >
                  Close Manager
                </button>
              </div>
            </div>

            {/* Overall Progress Banner */}
            <div className="qm-progress-card">
              <div className="qm-progress-top">
                <div className="qm-progress-title">
                  <strong>Contest Question Progress:</strong> {contestQuestions.length} of 15 Questions Added
                </div>
                <div className="qm-progress-pills">
                  <span className={`qm-pill ${physicsQuestions.length === 5 ? 'pill-ready' : 'pill-wait'}`}>
                    Physics: {physicsQuestions.length} / 5
                  </span>
                  <span className={`qm-pill ${chemistryQuestions.length === 5 ? 'pill-ready' : 'pill-wait'}`}>
                    Chemistry: {chemistryQuestions.length} / 5
                  </span>
                  <span className={`qm-pill ${mathQuestions.length === 5 ? 'pill-ready' : 'pill-wait'}`}>
                    Mathematics: {mathQuestions.length} / 5
                  </span>
                </div>
              </div>

              <div className="qm-progress-bar-track">
                <div
                  className="qm-progress-bar-fill"
                  style={{ width: `${(contestQuestions.length / 15) * 100}%` }}
                />
              </div>

              {contestQuestions.length === 15 &&
              physicsQuestions.length === 5 &&
              chemistryQuestions.length === 5 &&
              mathQuestions.length === 5 ? (
                <div className="qm-ready-note">
                  <CheckCircle2 size={16} className="text-success" />
                  <span>All 15 questions are complete and validated. You can publish this contest!</span>
                </div>
              ) : (
                <div className="qm-pending-note">
                  <AlertTriangle size={16} className="text-warning" />
                  <span>
                    Publishing requires exactly 5 questions per subject. Add remaining questions in the tabs below.
                  </span>
                </div>
              )}
            </div>

            {/* Subject Tabs */}
            <div className="qm-subject-tabs-row">
              <button
                className={`qm-sub-tab ${activeSubjectTab === 'Physics' ? 'active phy' : ''}`}
                onClick={() => setActiveSubjectTab('Physics')}
              >
                <Atom size={16} /> Physics ({physicsQuestions.length} / 5)
              </button>
              <button
                className={`qm-sub-tab ${activeSubjectTab === 'Chemistry' ? 'active chem' : ''}`}
                onClick={() => setActiveSubjectTab('Chemistry')}
              >
                <Flame size={16} /> Chemistry ({chemistryQuestions.length} / 5)
              </button>
              <button
                className={`qm-sub-tab ${activeSubjectTab === 'Mathematics' ? 'active math' : ''}`}
                onClick={() => setActiveSubjectTab('Mathematics')}
              >
                <Calculator size={16} /> Mathematics ({mathQuestions.length} / 5)
              </button>

              <div style={{ marginLeft: 'auto' }}>
                <button
                  className="menti-btn menti-btn-primary"
                  onClick={handleOpenAddQuestion}
                  disabled={getActiveTabQuestions().length >= 5}
                >
                  <Plus size={16} /> Add {activeSubjectTab} Question ({getActiveTabQuestions().length}/5)
                </button>
              </div>
            </div>

            {/* Questions List for Active Subject */}
            <div className="qm-questions-list-card">
              {loadingQuestions ? (
                <div className="menti-loading-state" style={{ padding: '3rem' }}>
                  <div className="menti-spinner" />
                  <p>Loading questions for {activeSubjectTab}...</p>
                </div>
              ) : getActiveTabQuestions().length === 0 ? (
                <div className="menti-empty-state" style={{ padding: '3rem' }}>
                  <Edit3 size={40} className="menti-empty-icon" />
                  <h3 className="menti-empty-title">No {activeSubjectTab} Questions Added Yet</h3>
                  <p className="menti-empty-desc">
                    Click "Add {activeSubjectTab} Question" to enter questions directly through the question authoring form.
                  </p>
                  <button
                    className="menti-btn menti-btn-primary"
                    onClick={handleOpenAddQuestion}
                    style={{ marginTop: '1rem' }}
                  >
                    <Plus size={16} /> Add First {activeSubjectTab} Question
                  </button>
                </div>
              ) : (
                <div className="qm-questions-cards-stack">
                  {getActiveTabQuestions().map((q, idx) => (
                    <div key={q.id || idx} className="qm-q-item-card">
                      <div className="qm-q-item-top">
                        <div className="qm-q-meta-badges">
                          <span className="qm-q-num">#{idx + 1}</span>
                          <span className="qm-q-topic">{q.topic}</span>
                          <span className={`qm-q-type ${q.questionType?.toLowerCase()}`}>
                            {q.questionType}
                          </span>
                          <span className={`qm-q-diff ${q.difficulty?.toLowerCase()}`}>
                            {q.difficulty}
                          </span>
                          <span className="qm-q-marks">+{q.marks} / -{q.negativeMarks}</span>
                        </div>

                        <div className="qm-q-item-actions">
                          <button
                            className="qm-action-btn"
                            title="Student Preview"
                            onClick={() => setPreviewQuestion(q)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="qm-action-btn"
                            title="Edit Question"
                            onClick={() => handleOpenEditQuestion(q)}
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            className="qm-action-btn delete"
                            title="Delete Question"
                            onClick={() => handleDeleteQuestion(q.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="qm-q-statement">{q.questionText}</div>

                      {q.questionType === 'MCQ' ? (
                        <div className="qm-mcq-grid">
                          {[
                            { label: 'A', text: q.optionA },
                            { label: 'B', text: q.optionB },
                            { label: 'C', text: q.optionC },
                            { label: 'D', text: q.optionD },
                          ].map((opt) => (
                            <div
                              key={opt.label}
                              className={`qm-opt-box ${q.correctAnswer === opt.label ? 'is-correct' : ''}`}
                            >
                              <span className="qm-opt-letter">{opt.label}</span>
                              <span className="qm-opt-text">{opt.text}</span>
                              {q.correctAnswer === opt.label && (
                                <span className="qm-opt-correct-tag">Correct Answer</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="qm-num-answer-box">
                          <strong>Correct Numerical Value:</strong>{' '}
                          <span className="num-val">{q.correctAnswer}</span>
                          {q.numericalTolerance > 0 && (
                            <span className="num-tol"> (Tolerance: ±{q.numericalTolerance})</span>
                          )}
                        </div>
                      )}

                      {q.explanation && (
                        <div className="qm-explanation-snippet">
                          <strong>Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* ALL CONTESTS TABLE */}
        {/* ============================================================== */}
        <section className="admin-contests-list-section">
          <div className="table-top-bar">
            <h2 className="menti-section-title" style={{ margin: 0 }}>
              All Contests ({contests.length})
            </h2>
          </div>

          <div className="menti-table-card">
            <table className="menti-data-table">
              <thead>
                <tr>
                  <th>Contest Title</th>
                  <th>Schedule</th>
                  <th>Duration</th>
                  <th>Questions</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contests.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No contests created yet. Click "Create New Contest" to get started.
                    </td>
                  </tr>
                ) : (
                  contests.map((c) => {
                    const isDraft = c.status === 'DRAFT';
                    const isPublished = c.status === 'PUBLISHED';
                    const isCancelled = c.status === 'CANCELLED';

                    return (
                      <tr key={c.id}>
                        <td>
                          <div className="admin-contest-cell">
                            <strong>{c.title}</strong>
                            <span className="admin-contest-sub">{c.description?.substring(0, 75)}...</span>
                          </div>
                        </td>
                        <td>
                          <div className="admin-schedule-cell">
                            <span>{new Date(c.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span className="schedule-time">{new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>
                        <td>{c.durationMinutes} Mins</td>
                        <td>
                          <span className="badge-q-count">
                            {c.totalQuestions || 15} Qs
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill pill-${(c.status || '').toLowerCase()}`}>
                            {c.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="attempts-link-btn"
                            onClick={() => handleViewAttempts(c)}
                          >
                            <Users size={14} /> {c.participantCount || 0}
                          </button>
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <button
                              className="menti-btn menti-btn-primary menti-btn-sm"
                              onClick={() => openQuestionManagement(c)}
                              title="Direct Question Management"
                            >
                              <Edit3 size={14} /> Manage Questions
                            </button>

                            <button
                              className="menti-btn menti-btn-outline menti-btn-sm"
                              onClick={() => handleOpenEditContest(c)}
                              title="Edit Contest Details"
                            >
                              Edit Info
                            </button>

                            {isDraft && (
                              <button
                                className="menti-btn menti-btn-success menti-btn-sm"
                                onClick={() => handlePublishContest(c.id)}
                                title="Publish Contest"
                              >
                                Publish
                              </button>
                            )}

                            {!isCancelled && (
                              <button
                                className="menti-btn menti-btn-danger-outline menti-btn-sm"
                                onClick={() => handleCancelContest(c.id)}
                                title="Cancel Contest"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ============================================================== */}
      {/* MODAL 1: CONTEST DETAILS (STEPS 1 & 2) */}
      {/* ============================================================== */}
      {showContestModal && (
        <div className="menti-modal-overlay">
          <div className="menti-modal-card modal-lg">
            <div className="menti-modal-header">
              <h3 className="menti-modal-title">
                {editingContest ? 'Edit Contest Details' : 'Step 1 & 2: Contest Details & Topics'}
              </h3>
              <button className="menti-modal-close" onClick={() => setShowContestModal(false)}>×</button>
            </div>

            <form onSubmit={handleSaveContest}>
              <div className="menti-modal-body modal-scroll">
                <div className="form-grid-2">
                  <div className="menti-form-group span-2">
                    <label className="menti-label">Contest Title *</label>
                    <input
                      type="text"
                      required
                      value={contestFormData.title}
                      onChange={(e) => setContestFormData({ ...contestFormData, title: e.target.value })}
                      placeholder="e.g. All-India JEE Premier Challenge #2"
                      className="menti-input"
                    />
                  </div>

                  <div className="menti-form-group span-2">
                    <label className="menti-label">Contest Description</label>
                    <textarea
                      rows={2}
                      value={contestFormData.description}
                      onChange={(e) => setContestFormData({ ...contestFormData, description: e.target.value })}
                      placeholder="Brief summary of syllabus and competition details..."
                      className="menti-textarea"
                    />
                  </div>

                  <div className="menti-form-group">
                    <label className="menti-label">Start Date &amp; Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={contestFormData.startTime}
                      onChange={(e) => setContestFormData({ ...contestFormData, startTime: e.target.value })}
                      className="menti-input"
                    />
                  </div>

                  <div className="menti-form-group">
                    <label className="menti-label">End Date &amp; Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={contestFormData.endTime}
                      onChange={(e) => setContestFormData({ ...contestFormData, endTime: e.target.value })}
                      className="menti-input"
                    />
                  </div>

                  <div className="menti-form-group">
                    <label className="menti-label">Duration (Minutes) *</label>
                    <input
                      type="number"
                      required
                      min={10}
                      max={360}
                      value={contestFormData.durationMinutes}
                      onChange={(e) => setContestFormData({ ...contestFormData, durationMinutes: parseInt(e.target.value) || 60 })}
                      className="menti-input"
                    />
                  </div>

                  <div className="menti-form-group">
                    <label className="menti-label">Marking Scheme (+Correct / -Negative)</label>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <input
                        type="number"
                        min={1}
                        placeholder="+4"
                        value={contestFormData.correctMarks}
                        onChange={(e) => setContestFormData({ ...contestFormData, correctMarks: parseInt(e.target.value) || 4 })}
                        className="menti-input"
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="-1"
                        value={contestFormData.negativeMarks}
                        onChange={(e) => setContestFormData({ ...contestFormData, negativeMarks: parseInt(e.target.value) || 0 })}
                        className="menti-input"
                      />
                    </div>
                  </div>

                  {/* Step 2: Topics Selection */}
                  <div className="menti-form-group span-2">
                    <label className="menti-label">Physics Chapters / Topics</label>
                    <input
                      type="text"
                      value={contestFormData.physicsTopics}
                      onChange={(e) => setContestFormData({ ...contestFormData, physicsTopics: e.target.value })}
                      placeholder="e.g. Kinematics, Laws of Motion, Work Power Energy"
                      className="menti-input"
                    />
                  </div>

                  <div className="menti-form-group span-2">
                    <label className="menti-label">Chemistry Chapters / Topics</label>
                    <input
                      type="text"
                      value={contestFormData.chemistryTopics}
                      onChange={(e) => setContestFormData({ ...contestFormData, chemistryTopics: e.target.value })}
                      placeholder="e.g. Atomic Structure, Chemical Bonding, Organic Basics"
                      className="menti-input"
                    />
                  </div>

                  <div className="menti-form-group span-2">
                    <label className="menti-label">Mathematics Chapters / Topics</label>
                    <input
                      type="text"
                      value={contestFormData.mathematicsTopics}
                      onChange={(e) => setContestFormData({ ...contestFormData, mathematicsTopics: e.target.value })}
                      placeholder="e.g. Differential Calculus, Vectors & 3D, Matrices"
                      className="menti-input"
                    />
                  </div>

                  <div className="menti-form-group span-2">
                    <label className="menti-label">Contest Instructions</label>
                    <textarea
                      rows={4}
                      value={contestFormData.instructions}
                      onChange={(e) => setContestFormData({ ...contestFormData, instructions: e.target.value })}
                      className="menti-textarea"
                    />
                  </div>
                </div>
              </div>

              <div className="menti-modal-footer">
                <button
                  type="button"
                  className="menti-btn menti-btn-outline"
                  onClick={() => setShowContestModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="menti-btn menti-btn-primary">
                  {editingContest ? 'Update Contest' : 'Save & Proceed to Questions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: QUESTION ENTRY / EDIT FORM */}
      {/* ============================================================== */}
      {showQuestionModal && (
        <div className="menti-modal-overlay">
          <div className="menti-modal-card modal-lg">
            <div className="menti-modal-header">
              <h3 className="menti-modal-title">
                {editingQuestion ? 'Edit Question' : `Add ${questionFormData.subjectName} Question`}
              </h3>
              <button className="menti-modal-close" onClick={() => setShowQuestionModal(false)}>×</button>
            </div>

            <form onSubmit={handleSaveQuestion}>
              <div className="menti-modal-body modal-scroll">
                <div className="form-grid-2">
                  {/* Subject (Auto-Selected) */}
                  <div className="menti-form-group">
                    <label className="menti-label">Subject</label>
                    <input
                      type="text"
                      readOnly
                      value={questionFormData.subjectName}
                      className="menti-input readonly"
                    />
                  </div>

                  {/* Topic Dropdown */}
                  <div className="menti-form-group">
                    <label className="menti-label">Topic or Chapter *</label>
                    <select
                      value={questionFormData.topic}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, topic: e.target.value })}
                      className="menti-select"
                    >
                      <option value="">Select Chapter / Topic</option>
                      {(backendTopics[questionFormData.subjectName] || []).map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                      <option value="CUSTOM">+ Enter Custom Chapter Name</option>
                    </select>
                  </div>

                  {/* Custom Topic Input if selected */}
                  {(questionFormData.topic === 'CUSTOM' || !questionFormData.topic) && (
                    <div className="menti-form-group span-2">
                      <label className="menti-label">Custom Topic / Chapter Name *</label>
                      <input
                        type="text"
                        value={questionFormData.customTopic}
                        onChange={(e) => setQuestionFormData({ ...questionFormData, customTopic: e.target.value })}
                        placeholder="e.g. Modern Physics & Nuclear Physics"
                        className="menti-input"
                      />
                    </div>
                  )}

                  {/* Difficulty & Question Type */}
                  <div className="menti-form-group">
                    <label className="menti-label">Difficulty Level</label>
                    <select
                      value={questionFormData.difficulty}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, difficulty: e.target.value })}
                      className="menti-select"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>

                  <div className="menti-form-group">
                    <label className="menti-label">Question Type</label>
                    <select
                      value={questionFormData.questionType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setQuestionFormData({
                          ...questionFormData,
                          questionType: newType,
                          correctAnswer: newType === 'MCQ' ? 'A' : '',
                          negativeMarks: newType === 'NUMERICAL' ? 0 : 1
                        });
                      }}
                      className="menti-select"
                    >
                      <option value="MCQ">Multiple Choice Question (MCQ)</option>
                      <option value="NUMERICAL">Numerical Answer</option>
                    </select>
                  </div>

                  {/* Question Text */}
                  <div className="menti-form-group span-2">
                    <label className="menti-label">Question Text Statement *</label>
                    <textarea
                      rows={4}
                      required
                      value={questionFormData.questionText}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, questionText: e.target.value })}
                      placeholder="Type the complete question text here..."
                      className="menti-textarea"
                    />
                  </div>

                  {/* MCQ Options vs Numerical */}
                  {questionFormData.questionType === 'MCQ' ? (
                    <div className="mcq-options-entry-box span-2">
                      <div className="mcq-options-entry-title">
                        MCQ Options (Provide all 4 options &amp; select the correct answer radio):
                      </div>

                      <div className="mcq-option-input-row">
                        <label className="radio-label">
                          <input
                            type="radio"
                            name="correctAnswerOption"
                            checked={questionFormData.correctAnswer === 'A'}
                            onChange={() => setQuestionFormData({ ...questionFormData, correctAnswer: 'A' })}
                          />
                          <span className="opt-letter">Option A</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={questionFormData.optionA}
                          onChange={(e) => setQuestionFormData({ ...questionFormData, optionA: e.target.value })}
                          placeholder="Option A text..."
                          className="menti-input"
                        />
                      </div>

                      <div className="mcq-option-input-row">
                        <label className="radio-label">
                          <input
                            type="radio"
                            name="correctAnswerOption"
                            checked={questionFormData.correctAnswer === 'B'}
                            onChange={() => setQuestionFormData({ ...questionFormData, correctAnswer: 'B' })}
                          />
                          <span className="opt-letter">Option B</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={questionFormData.optionB}
                          onChange={(e) => setQuestionFormData({ ...questionFormData, optionB: e.target.value })}
                          placeholder="Option B text..."
                          className="menti-input"
                        />
                      </div>

                      <div className="mcq-option-input-row">
                        <label className="radio-label">
                          <input
                            type="radio"
                            name="correctAnswerOption"
                            checked={questionFormData.correctAnswer === 'C'}
                            onChange={() => setQuestionFormData({ ...questionFormData, correctAnswer: 'C' })}
                          />
                          <span className="opt-letter">Option C</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={questionFormData.optionC}
                          onChange={(e) => setQuestionFormData({ ...questionFormData, optionC: e.target.value })}
                          placeholder="Option C text..."
                          className="menti-input"
                        />
                      </div>

                      <div className="mcq-option-input-row">
                        <label className="radio-label">
                          <input
                            type="radio"
                            name="correctAnswerOption"
                            checked={questionFormData.correctAnswer === 'D'}
                            onChange={() => setQuestionFormData({ ...questionFormData, correctAnswer: 'D' })}
                          />
                          <span className="opt-letter">Option D</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={questionFormData.optionD}
                          onChange={(e) => setQuestionFormData({ ...questionFormData, optionD: e.target.value })}
                          placeholder="Option D text..."
                          className="menti-input"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="numerical-entry-box span-2">
                      <div className="form-grid-2">
                        <div className="menti-form-group">
                          <label className="menti-label">Numerical Correct Answer *</label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={questionFormData.correctAnswer}
                            onChange={(e) => setQuestionFormData({ ...questionFormData, correctAnswer: e.target.value })}
                            placeholder="e.g. 15.5 or -2.4"
                            className="menti-input"
                          />
                        </div>

                        <div className="menti-form-group">
                          <label className="menti-label">Allowed Tolerance (±)</label>
                          <input
                            type="number"
                            step="any"
                            value={questionFormData.numericalTolerance}
                            onChange={(e) => setQuestionFormData({ ...questionFormData, numericalTolerance: parseFloat(e.target.value) || 0.0 })}
                            placeholder="0.0"
                            className="menti-input"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Marks & Negative Marks */}
                  <div className="menti-form-group">
                    <label className="menti-label">Marks Awarded</label>
                    <input
                      type="number"
                      min={1}
                      value={questionFormData.marks}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, marks: parseInt(e.target.value) || 4 })}
                      className="menti-input"
                    />
                  </div>

                  <div className="menti-form-group">
                    <label className="menti-label">Negative Marks</label>
                    <input
                      type="number"
                      min={0}
                      value={questionFormData.negativeMarks}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, negativeMarks: parseInt(e.target.value) || 0 })}
                      className="menti-input"
                    />
                  </div>

                  {/* Explanation */}
                  <div className="menti-form-group span-2">
                    <label className="menti-label">Step-by-Step Solution &amp; Explanation</label>
                    <textarea
                      rows={3}
                      value={questionFormData.explanation}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, explanation: e.target.value })}
                      placeholder="Enter detailed mathematical explanation or concept derivation..."
                      className="menti-textarea"
                    />
                  </div>
                </div>
              </div>

              <div className="menti-modal-footer">
                <button
                  type="button"
                  className="menti-btn menti-btn-outline"
                  onClick={() => setShowQuestionModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="menti-btn menti-btn-primary">
                  {editingQuestion ? 'Update Question in DB' : 'Save Question to DB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: STUDENT VIEW PREVIEW (SINGLE QUESTION) */}
      {/* ============================================================== */}
      {previewQuestion && (
        <div className="menti-modal-overlay">
          <div className="menti-modal-card">
            <div className="menti-modal-header">
              <h3 className="menti-modal-title">Student Exam View Preview</h3>
              <button className="menti-modal-close" onClick={() => setPreviewQuestion(null)}>×</button>
            </div>

            <div className="menti-modal-body">
              <div className="preview-top-bar">
                <span className="ws-q-subject-chip">{previewQuestion.subjectName}</span>
                <span className="ws-q-type-chip">{previewQuestion.questionType}</span>
                <span className="ws-q-diff-chip">{previewQuestion.difficulty}</span>
                <span className="ws-q-marks-chip">+{previewQuestion.marks} / -{previewQuestion.negativeMarks}</span>
              </div>

              <div className="preview-statement">
                {previewQuestion.questionText}
              </div>

              {previewQuestion.questionType === 'MCQ' ? (
                <div className="preview-options-list">
                  {[
                    { label: 'A', text: previewQuestion.optionA },
                    { label: 'B', text: previewQuestion.optionB },
                    { label: 'C', text: previewQuestion.optionC },
                    { label: 'D', text: previewQuestion.optionD },
                  ].map((opt) => (
                    <div
                      key={opt.label}
                      className={`preview-opt-card ${previewQuestion.correctAnswer === opt.label ? 'admin-correct-highlight' : ''}`}
                    >
                      <span className="opt-circle">{opt.label}</span>
                      <span className="opt-text">{opt.text}</span>
                      {previewQuestion.correctAnswer === opt.label && (
                        <span className="correct-tag">Admin Correct Answer Key</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="preview-numerical-box">
                  <label>Student Numerical Input:</label>
                  <input
                    type="number"
                    disabled
                    placeholder={`Expected: ${previewQuestion.correctAnswer} (±${previewQuestion.numericalTolerance})`}
                    className="menti-input readonly"
                  />
                </div>
              )}

              {previewQuestion.explanation && (
                <div className="preview-explanation">
                  <strong>Explanation Key:</strong> {previewQuestion.explanation}
                </div>
              )}
            </div>

            <div className="menti-modal-footer">
              <button className="menti-btn menti-btn-primary" onClick={() => setPreviewQuestion(null)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: FULL CONTEST PREVIEW (ALL 15 QUESTIONS) */}
      {/* ============================================================== */}
      {showContestFullPreview && (
        <div className="menti-modal-overlay">
          <div className="menti-modal-card modal-xl">
            <div className="menti-modal-header">
              <h3 className="menti-modal-title">
                Full Contest Preview: {activeContestForQuestions?.title}
              </h3>
              <button className="menti-modal-close" onClick={() => setShowContestFullPreview(false)}>×</button>
            </div>

            <div className="menti-modal-body modal-scroll" style={{ maxHeight: '70vh' }}>
              <div className="preview-subject-group">
                <h4 className="preview-group-title">Physics (Questions 1 to 5)</h4>
                {physicsQuestions.map((q, i) => (
                  <div key={q.id || i} className="full-preview-q-card">
                    <div className="fp-q-header">
                      <strong>Q{i + 1}. [{q.topic}]</strong>
                      <span>+{q.marks} / -{q.negativeMarks}</span>
                    </div>
                    <p>{q.questionText}</p>
                    {q.questionType === 'MCQ' ? (
                      <div className="fp-opts">
                        <div>A) {q.optionA}</div>
                        <div>B) {q.optionB}</div>
                        <div>C) {q.optionC}</div>
                        <div>D) {q.optionD}</div>
                        <div className="fp-correct">Correct: Option {q.correctAnswer}</div>
                      </div>
                    ) : (
                      <div className="fp-correct">Correct Numerical Answer: {q.correctAnswer} (±{q.numericalTolerance})</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="preview-subject-group">
                <h4 className="preview-group-title">Chemistry (Questions 6 to 10)</h4>
                {chemistryQuestions.map((q, i) => (
                  <div key={q.id || i} className="full-preview-q-card">
                    <div className="fp-q-header">
                      <strong>Q{i + 6}. [{q.topic}]</strong>
                      <span>+{q.marks} / -{q.negativeMarks}</span>
                    </div>
                    <p>{q.questionText}</p>
                    {q.questionType === 'MCQ' ? (
                      <div className="fp-opts">
                        <div>A) {q.optionA}</div>
                        <div>B) {q.optionB}</div>
                        <div>C) {q.optionC}</div>
                        <div>D) {q.optionD}</div>
                        <div className="fp-correct">Correct: Option {q.correctAnswer}</div>
                      </div>
                    ) : (
                      <div className="fp-correct">Correct Numerical Answer: {q.correctAnswer} (±{q.numericalTolerance})</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="preview-subject-group">
                <h4 className="preview-group-title">Mathematics (Questions 11 to 15)</h4>
                {mathQuestions.map((q, i) => (
                  <div key={q.id || i} className="full-preview-q-card">
                    <div className="fp-q-header">
                      <strong>Q{i + 11}. [{q.topic}]</strong>
                      <span>+{q.marks} / -{q.negativeMarks}</span>
                    </div>
                    <p>{q.questionText}</p>
                    {q.questionType === 'MCQ' ? (
                      <div className="fp-opts">
                        <div>A) {q.optionA}</div>
                        <div>B) {q.optionB}</div>
                        <div>C) {q.optionC}</div>
                        <div>D) {q.optionD}</div>
                        <div className="fp-correct">Correct: Option {q.correctAnswer}</div>
                      </div>
                    ) : (
                      <div className="fp-correct">Correct Numerical Answer: {q.correctAnswer} (±{q.numericalTolerance})</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="menti-modal-footer">
              <button className="menti-btn menti-btn-primary" onClick={() => setShowContestFullPreview(false)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: ATTEMPTS LIST */}
      {/* ============================================================== */}
      {showAttemptsModal && (
        <div className="menti-modal-overlay">
          <div className="menti-modal-card modal-lg">
            <div className="menti-modal-header">
              <h3 className="menti-modal-title">
                Participant Submissions: {selectedContestTitle}
              </h3>
              <button className="menti-modal-close" onClick={() => setShowAttemptsModal(false)}>×</button>
            </div>

            <div className="menti-modal-body modal-scroll">
              {selectedContestAttempts.length === 0 ? (
                <div className="menti-empty-state">
                  <Users size={36} className="menti-empty-icon" />
                  <p>No participant submissions recorded for this contest.</p>
                </div>
              ) : (
                <table className="menti-data-table">
                  <thead>
                    <tr>
                      <th>Participant Name</th>
                      <th>Email</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Submitted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedContestAttempts.map((att) => (
                      <tr key={att.id}>
                        <td><strong>{att.participantName}</strong></td>
                        <td>{att.participantEmail}</td>
                        <td><strong>{att.totalScore} / 60</strong></td>
                        <td>
                          <span className={`status-pill ${att.isSubmitted ? 'pill-published' : 'pill-draft'}`}>
                            {att.isSubmitted ? 'SUBMITTED' : 'IN PROGRESS'}
                          </span>
                        </td>
                        <td>{att.submittedAt ? new Date(att.submittedAt).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="menti-modal-footer">
              <button className="menti-btn menti-btn-primary" onClick={() => setShowAttemptsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContestsDashboard;
