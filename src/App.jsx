import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import QuestionPractice from './pages/QuestionPractice';
import FinalResult from './pages/FinalResult';
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </PracticeProvider>
  );
}

export default App;
