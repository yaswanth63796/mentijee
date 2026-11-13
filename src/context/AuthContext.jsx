import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout, getMe } from '../api/authApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('mentijee_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const authHeader = localStorage.getItem('mentijee_auth_header');
      if (authHeader) {
        try {
          const userData = await getMe();
          if (userData && userData.email) {
            setUser(userData);
            localStorage.setItem('mentijee_user', JSON.stringify(userData));
          }
        } catch (err) {
          // If expired or invalid, keep stored user or clear
          if (err.response?.status === 401) {
            localStorage.removeItem('mentijee_auth_header');
            localStorage.removeItem('mentijee_user');
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (email, password) => {
    const res = await apiLogin(email, password);
    if (res && res.status === 'success') {
      setUser(res);
      return { success: true, user: res };
    }
    return { success: false, message: res?.message || 'Login failed' };
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  const isAdmin = Boolean(
    user && (user.role === 'ADMIN' || user.role === 'ROLE_ADMIN')
  );

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
