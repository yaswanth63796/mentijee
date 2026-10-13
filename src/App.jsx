import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import QuestionPractice from './pages/QuestionPractice';
import FinalResult from './pages/FinalResult';
import TestHistory from './pages/TestHistory';
import TestDetail from './pages/TestDetail';
import PerformanceDashboard from './pages/PerformanceDashboard';
import { PracticeProvider } from './context/PracticeContext';
import './index.css';

function App() {
  return (
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </PracticeProvider>
  );
}

export default App;
