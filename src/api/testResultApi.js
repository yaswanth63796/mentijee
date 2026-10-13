import axios from 'axios';

const BASE_URL = 'http://localhost:8081';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/** Save a completed test result. Idempotent — same sessionId returns existing record. */
export const saveTestResult = async (payload) => {
  const response = await api.post('/api/test-results', payload);
  return response.data;
};

/** Get all test results newest-first */
export const getTestHistory = async () => {
  const response = await api.get('/api/test-results');
  return response.data;
};

/** Get one test result by ID */
export const getTestDetail = async (id) => {
  const response = await api.get(`/api/test-results/${id}`);
  return response.data;
};

/** Get analytics / chart data */
export const getAnalytics = async () => {
  const response = await api.get('/api/test-results/analytics');
  return response.data;
};

export default api;
