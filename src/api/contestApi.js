import axios from 'axios';

const BASE_URL = 'http://localhost:8081';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add Basic auth header if present
api.interceptors.request.use((config) => {
  const authHeader = localStorage.getItem('mentijee_auth_header');
  if (authHeader) {
    config.headers['Authorization'] = authHeader;
  }
  return config;
});

// =========================================================================
// STUDENT APIS
// =========================================================================

export const getPublishedContests = async () => {
  const res = await api.get('/api/contests');
  return res.data;
};

export const getContestDetails = async (contestId) => {
  const res = await api.get(`/api/contests/${contestId}`);
  return res.data;
};

export const joinContest = async (contestId, payload) => {
  const res = await api.post(`/api/contests/${contestId}/join`, payload);
  return res.data;
};

export const resumeAttempt = async (contestId, sessionId) => {
  const res = await api.get(`/api/contests/${contestId}/attempt?sessionId=${encodeURIComponent(sessionId)}`);
  return res.data;
};

export const getSafeQuestions = async (contestId, sessionId) => {
  const res = await api.get(`/api/contests/${contestId}/questions?sessionId=${encodeURIComponent(sessionId)}`);
  return res.data;
};

export const saveAnswer = async (contestId, questionId, payload) => {
  const res = await api.put(`/api/contests/${contestId}/answers/${questionId}`, payload);
  return res.data;
};

export const submitContest = async (contestId, payload) => {
  const res = await api.post(`/api/contests/${contestId}/submit`, payload);
  return res.data;
};

export const getContestResult = async (contestId, sessionId) => {
  const res = await api.get(`/api/contests/${contestId}/result?sessionId=${encodeURIComponent(sessionId)}`);
  return res.data;
};

export const getContestLeaderboard = async (contestId, sessionId = '') => {
  const url = sessionId
    ? `/api/contests/${contestId}/leaderboard?sessionId=${encodeURIComponent(sessionId)}`
    : `/api/contests/${contestId}/leaderboard`;
  const res = await api.get(url);
  return res.data;
};

// =========================================================================
// ADMIN APIS
// =========================================================================

export const adminGetAllContests = async () => {
  const res = await api.get('/api/admin/contests');
  return res.data;
};

export const adminGetContestDetails = async (contestId) => {
  const res = await api.get(`/api/admin/contests/${contestId}`);
  return res.data;
};

export const adminCreateContest = async (payload) => {
  const res = await api.post('/api/admin/contests', payload);
  return res.data;
};

export const adminUpdateContest = async (contestId, payload) => {
  const res = await api.put(`/api/admin/contests/${contestId}`, payload);
  return res.data;
};

export const adminPreviewQuestions = async (contestId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post(`/api/admin/contests/${contestId}/preview-questions`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const adminUploadQuestions = async (contestId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post(`/api/admin/contests/${contestId}/upload-questions`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const adminGetTopics = async () => {
  const res = await api.get('/api/admin/contests/topics');
  return res.data;
};

export const adminAddQuestion = async (contestId, payload) => {
  const res = await api.post(`/api/admin/contests/${contestId}/questions`, payload);
  return res.data;
};

export const adminUpdateQuestion = async (contestId, questionId, payload) => {
  const res = await api.put(`/api/admin/contests/${contestId}/questions/${questionId}`, payload);
  return res.data;
};

export const adminDeleteQuestion = async (contestId, questionId) => {
  const res = await api.delete(`/api/admin/contests/${contestId}/questions/${questionId}`);
  return res.data;
};

export const adminSaveAllQuestions = async (contestId, questionsList) => {
  const res = await api.post(`/api/admin/contests/${contestId}/save-all-questions`, questionsList);
  return res.data;
};

export const adminPublishContest = async (contestId) => {
  const res = await api.post(`/api/admin/contests/${contestId}/publish`);
  return res.data;
};

export const adminCancelContest = async (contestId) => {
  const res = await api.post(`/api/admin/contests/${contestId}/cancel`);
  return res.data;
};

export const adminGetQuestions = async (contestId) => {
  const res = await api.get(`/api/admin/contests/${contestId}/questions`);
  return res.data;
};

export const adminGetAttempts = async (contestId) => {
  const res = await api.get(`/api/admin/contests/${contestId}/attempts`);
  return res.data;
};

export const adminDownloadTemplate = (format) => {
  window.open(`${BASE_URL}/api/admin/contests/template/${format}`, '_blank');
};

export default api;
