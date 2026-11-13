import axios from 'axios';

const BASE_URL = 'http://localhost:8081';

const authApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add Basic auth header if saved in localStorage
authApi.interceptors.request.use((config) => {
  const authHeader = localStorage.getItem('mentijee_auth_header');
  if (authHeader) {
    config.headers['Authorization'] = authHeader;
  }
  return config;
});

export const login = async (email, password) => {
  const credentials = btoa(`${email}:${password}`);
  const authHeader = `Basic ${credentials}`;

  const response = await authApi.post('/api/login', { email, password }, {
    headers: { Authorization: authHeader }
  });

  if (response.data && response.data.status === 'success') {
    localStorage.setItem('mentijee_auth_header', authHeader);
    localStorage.setItem('mentijee_user', JSON.stringify(response.data));
  }
  return response.data;
};

export const getMe = async () => {
  const response = await authApi.get('/api/auth/me');
  return response.data;
};

export const logout = async () => {
  try {
    await authApi.post('/api/auth/logout');
  } catch (ignored) {
  } finally {
    localStorage.removeItem('mentijee_auth_header');
    localStorage.removeItem('mentijee_user');
  }
};

export const register = async (userData) => {
  const response = await authApi.post('/api/register', userData);
  return response.data;
};

export default authApi;
