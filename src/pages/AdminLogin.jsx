import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both administrator email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email.trim(), password.trim());
      if (res.success) {
        if (res.user.role === 'ADMIN' || res.user.role === 'ROLE_ADMIN') {
          navigate('/admin/contests');
        } else {
          setError('Access denied: This account does not have administrator privileges.');
        }
      } else {
        setError(res.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="menti-page-wrapper">
      <Navbar />

      <main className="menti-content-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)' }}>
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="admin-badge-icon">
              <Shield size={28} />
            </div>
            <h2 className="admin-login-title">Administrator Sign In</h2>
            <p className="admin-login-desc">
              Sign in to author JEE mock contests, manage questions, and oversee all-India leaderboards.
            </p>
          </div>

          {error && (
            <div className="menti-alert menti-alert-error" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="menti-form-group">
              <label className="menti-label">Administrator Email</label>
              <div className="menti-input-box">
                <Mail size={18} className="menti-input-icon" />
                <input
                  type="email"
                  placeholder="admin@mentijee.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="menti-input"
                />
              </div>
            </div>

            <div className="menti-form-group">
              <label className="menti-label">Password</label>
              <div className="menti-input-box">
                <Lock size={18} className="menti-input-icon" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="menti-input"
                />
              </div>
            </div>

            <div className="admin-hint-card">
              <strong>Default Admin Credentials:</strong>
              <div>Email: <code>admin@mentijee.com</code></div>
              <div>Password: <code>Admin@123</code></div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="menti-btn menti-btn-primary ws-full-btn"
              style={{ marginTop: '1.25rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign In as Administrator'}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;
