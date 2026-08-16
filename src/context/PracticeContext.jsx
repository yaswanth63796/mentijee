import React, { createContext, useContext, useState, useEffect } from 'react';

const PracticeContext = createContext();

export const PracticeProvider = ({ children }) => {
  const [session, setSession] = useState({
    isActive: false,
    overallTime: 0, // overall practice time in seconds
    currentSubjectId: null,
    subjectTime: 0, // current subject time in seconds
    results: {
      physics: { score: 0, totalMarks: 100, time: 0, completed: false },
      chemistry: { score: 0, totalMarks: 100, time: 0, completed: false },
      mathematics: { score: 0, totalMarks: 100, time: 0, completed: false },
    },
  });

  // Start brand new JEE Practice Set A session
  const startSession = () => {
    setSession({
      isActive: true,
      overallTime: 0,
      currentSubjectId: null,
      subjectTime: 0,
      results: {
        physics: { score: 0, totalMarks: 100, time: 0, completed: false },
        chemistry: { score: 0, totalMarks: 100, time: 0, completed: false },
        mathematics: { score: 0, totalMarks: 100, time: 0, completed: false },
      },
    });
  };

  // Start or switch to a subject timer
  const setSubject = (subjectId) => {
    setSession((prev) => ({
      ...prev,
      isActive: true,
      currentSubjectId: String(subjectId),
      subjectTime: 0,
    }));
  };

  // Save subject completion stats and reset subject timer
  const completeSubject = (subjectKey, score, totalMarks) => {
    setSession((prev) => {
      const subjectTimeTaken = prev.subjectTime;
      return {
        ...prev,
        subjectTime: 0,
        results: {
          ...prev.results,
          [subjectKey]: {
            score,
            totalMarks,
            time: subjectTimeTaken,
            completed: true,
          },
        },
      };
    });
  };

  // Complete overall session
  const finishSession = () => {
    setSession((prev) => ({
      ...prev,
      isActive: false,
    }));
  };

  // Timer interval effect
  useEffect(() => {
    let interval = null;
    if (session.isActive) {
      interval = setInterval(() => {
        setSession((prev) => ({
          ...prev,
          overallTime: prev.overallTime + 1,
          subjectTime: prev.currentSubjectId ? prev.subjectTime + 1 : prev.subjectTime,
        }));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session.isActive]);

  return (
    <PracticeContext.Provider
      value={{
        session,
        startSession,
        setSubject,
        completeSubject,
        finishSession,
      }}
    >
      {children}
    </PracticeContext.Provider>
  );
};

export const usePractice = () => useContext(PracticeContext);
