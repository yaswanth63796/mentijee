import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import QuestionPractice from './pages/QuestionPractice';
import FinalResult from './pages/FinalResult';
import TestHistory from './pages/TestHistory';
import TestDetail from './pages/TestDetail';
import PerformanceDashboard from './pages/PerformanceDashboard';
import ContestsList from './pages/ContestsList';
import ContestDetail from './pages/ContestDetail';
import ContestWorkspace from './pages/ContestWorkspace';
import ContestResult from './pages/ContestResult';
import ContestLeaderboard from './pages/ContestLeaderboard';
import AdminLogin from './pages/AdminLogin';
import AdminContestsDashboard from './pages/AdminContestsDashboard';
import AdminRoute from './components/AdminRoute';
import { PracticeProvider } from './context/PracticeContext';
import { AuthProvider } from './context/AuthContext';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <PracticeProvider>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/subjects" element={<Dashboard />} />
            <Route path="/practice/:subjectId" element={<QuestionPractice />} />
            <Route path="/results" element={<FinalResult />} />
            <Route path="/history" element={<TestHistory />} />
            <Route path="/history/:id" element={<TestDetail />} />
            <Route path="/performance" element={<PerformanceDashboard />} />

            {/* Contests Routes */}
            <Route path="/contests" element={<ContestsList />} />
            <Route path="/contests/:id" element={<ContestDetail />} />
            <Route path="/contests/:id/workspace" element={<ContestWorkspace />} />
            <Route path="/contests/:id/result" element={<ContestResult />} />
            <Route path="/contests/:id/leaderboard" element={<ContestLeaderboard />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/contests"
              element={
                <AdminRoute>
                  <AdminContestsDashboard />
                </AdminRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </PracticeProvider>
    </AuthProvider>
  );
}

export default App;
