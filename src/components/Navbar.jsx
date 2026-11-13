import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Trophy, BookOpen, History, BarChart2, User, LayoutDashboard,
  Shield, LogOut, CheckCircle, Menu, X, ChevronDown, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Student name/email from localStorage or AuthContext
  const studentName = user?.name || localStorage.getItem('mentijee_student_name') || 'Student';
  const studentEmail = user?.email || localStorage.getItem('mentijee_student_email') || 'student@mentijee.com';

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
    { label: 'Practice', path: '/subjects', icon: <BookOpen size={18} /> },
    { label: 'Contests', path: '/contests', icon: <Trophy size={18} /> },
    { label: 'Test History', path: '/history', icon: <History size={18} /> },
    { label: 'Performance', path: '/performance', icon: <BarChart2 size={18} /> },
  ];

  return (
    <>
      <header className="menti-navbar">
        <div className="menti-navbar-inner">
          {/* Brand Logo */}
          <div className="menti-brand" onClick={() => navigate('/')}>
            <div className="menti-logo-badge">
              <span className="menti-logo-text">M</span>
            </div>
            <div className="menti-brand-details">
              <div className="menti-brand-name">
                Menti<span>JEE</span>
              </div>
              <span className="menti-brand-tag">EXCELLENCE PLATFORM</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="menti-nav-links">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `menti-nav-item ${isActive || (item.path === '/' && location.pathname === '/') ? 'active' : ''}`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right Action / Profile */}
          <div className="menti-nav-actions">
            {isAdmin && (
              <button
                className="menti-admin-badge-btn"
                onClick={() => navigate('/admin/contests')}
                title="Admin Control Center"
              >
                <Shield size={15} />
                <span>Admin Panel</span>
              </button>
            )}

            <div className="menti-profile-wrapper">
              <button
                className="menti-profile-trigger"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-label="Student Profile"
              >
                <div className="menti-avatar">
                  {studentName.charAt(0).toUpperCase()}
                </div>
                <div className="menti-profile-text">
                  <span className="menti-profile-name">{studentName}</span>
                  <span className="menti-profile-role">JEE Aspirant</span>
                </div>
                <ChevronDown size={14} className={`menti-chevron ${profileOpen ? 'rotate' : ''}`} />
              </button>

              {profileOpen && (
                <div className="menti-profile-dropdown" onClick={(e) => e.stopPropagation()}>
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">{studentName.charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="dropdown-name">{studentName}</div>
                      <div className="dropdown-email">{studentEmail}</div>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <div className="dropdown-info-row">
                    <span className="dropdown-info-label">Target Exam</span>
                    <span className="dropdown-info-val">JEE Main & Adv 2026</span>
                  </div>
                  <div className="dropdown-info-row">
                    <span className="dropdown-info-label">Platform Status</span>
                    <span className="dropdown-info-val" style={{ color: 'var(--color-success)' }}>
                      Active Member
                    </span>
                  </div>

                  <div className="dropdown-divider" />

                  {isAdmin ? (
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/admin/contests');
                      }}
                    >
                      <Shield size={16} /> Admin Contests Management
                    </button>
                  ) : (
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/admin/login');
                      }}
                    >
                      <Shield size={16} /> Admin Sign In
                    </button>
                  )}

                  {user && (
                    <button
                      className="dropdown-item logout"
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                        navigate('/');
                      }}
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              className="menti-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="menti-mobile-menu">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `menti-mobile-item ${isActive ? 'active' : ''}`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
            <div className="mobile-divider" />
            <button
              className="menti-mobile-item admin"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate(isAdmin ? '/admin/contests' : '/admin/login');
              }}
            >
              <Shield size={18} />
              <span>{isAdmin ? 'Admin Dashboard' : 'Admin Login'}</span>
            </button>
          </div>
        )}
      </header>
      {profileOpen && (
        <div className="menti-backdrop" onClick={() => setProfileOpen(false)} />
      )}
    </>
  );
};

export default Navbar;
