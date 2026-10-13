import React, { createContext, useContext, useState, useEffect } from 'react';

const PracticeContext = createContext();

/** Generate a simple UUID v4 */
const generateSessionId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const defaultSubjectStats = () => ({
  score: 0,
  totalMarks: 100,
  time: 0,
  correct: 0,
  wrong: 0,
  completed: false,
});

export const PracticeProvider = ({ children }) => {
  const [session, setSession] = useState({
    isActive: false,
    sessionId: null,
    overallTime: 0,
    currentSubjectId: null,
    subjectTime: 0,
    results: {
      physics: defaultSubjectStats(),
      chemistry: defaultSubjectStats(),
      mathematics: defaultSubjectStats(),
    },
  });

  /** Start a brand-new practice session */
  const startSession = () => {
    setSession({
      isActive: true,
      sessionId: generateSessionId(),
      overallTime: 0,
      currentSubjectId: null,
      subjectTime: 0,
      results: {
        physics: defaultSubjectStats(),
        chemistry: defaultSubjectStats(),
        mathematics: defaultSubjectStats(),
      },
    });
  };

  /** Switch to a new subject — resets the subject timer */
  const setSubject = (subjectId) => {
    setSession((prev) => ({
      ...prev,
      isActive: true,
      currentSubjectId: String(subjectId),
      subjectTime: 0,
    }));
  };

  /**
   * Called when a student finishes all questions in a subject.
   * Captures the current subjectTime before resetting it.
   */
  const completeSubject = (subjectKey, score, totalMarks, correct = 0, wrong = 0) => {
    setSession((prev) => {
      const timeTaken = prev.subjectTime;
      return {
        ...prev,
        subjectTime: 0,
        results: {
          ...prev.results,
          [subjectKey]: {
            score,
            totalMarks,
            time: timeTaken,
            correct,
            wrong,
            completed: true,
          },
        },
      };
    });
  };

  /** Mark entire session as finished */
  const finishSession = () => {
    setSession((prev) => ({
      ...prev,
      isActive: false,
    }));
  };

  /** Tick every second while session is active */
  useEffect(() => {
    let interval = null;
    if (session.isActive) {
      interval = setInterval(() => {
        setSession((prev) => ({
          ...prev,
          overallTime: prev.overallTime + 1,
          subjectTime: prev.currentSubjectId
            ? prev.subjectTime + 1
            : prev.subjectTime,
        }));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session.isActive]);

  return (
    <PracticeContext.Provider
      value={{ session, startSession, setSubject, completeSubject, finishSession }}
    >
      {children}
    </PracticeContext.Provider>
  );
};

export const usePractice = () => useContext(PracticeContext);
