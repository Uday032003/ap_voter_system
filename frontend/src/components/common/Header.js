import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.js';
import {
  Users,
  MapPin,
  FileText,
  ShieldCheck,
  UploadCloud,
  Globe2,
  LogOut,
  LogIn,
  Settings,
  UserCheck,
  CheckCircle2,
  ChevronDown,
  Layers
} from 'lucide-react';

export default function Header() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading, logout, selectedConstituency } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'te' : 'en';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('ap_voters_lang', nextLang);
  };

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    logout();
    navigate('/');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/sign-in' || location.pathname === '/sign-up';
  const isLandingPage = location.pathname === '/';

  const isSuperAdmin = user?.role === 'super_admin';
  const isLeader = user?.role === 'leader';
  const isCommoner = user?.role === 'commoner';

  // Role-based logo destination
  const homeLink = user
    ? (isSuperAdmin ? '/admin/dashboard' : isLeader ? '/leader/dashboard' : '/commoner/voters')
    : '/';

  return (
    <header className="site-header">
      {/* Top Govt Bar */}
      <div className="gov-top-bar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
          <span className="gov-top-bar-title">{t('app.ap_gov', 'Government of Andhra Pradesh')}</span>
          <span className="gov-top-bar-date" style={{ fontSize: '0.72rem', opacity: 0.9, flexShrink: 0 }}>
            {new Date().toLocaleDateString(i18n.language === 'te' ? 'te-IN' : 'en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="container">
        <div className="header-inner">
          <Link to={homeLink} className="brand-wrapper" title="AP Voter Directory" aria-label="AP Voter Directory">
            <div className="brand-emblem">
              <img
                src="/ap-map-theme.jpg"
                alt="Andhra Pradesh Voter Directory"
                className="brand-logo-img"
              />
            </div>
          </Link>

          {/* Navigation Links based on role */}
          <nav>
            <ul className="nav-links">

              {/* Super Admin Navigation */}
              {isSuperAdmin && (
                <>
                  <li>
                    <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      <ShieldCheck size={16} />
                      <span>{t('nav.dashboard', 'Dashboard')}</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/constituencies" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      <Layers size={16} />
                      <span>{t('nav.constituencies', 'Constituencies')}</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/voters" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      <Users size={16} />
                      <span>{t('nav.voters', 'All Voters')}</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/imports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      <UploadCloud size={16} />
                      <span>{t('nav.imports', 'CSV Imports')}</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/access-requests" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      <UserCheck size={16} />
                      <span>{t('nav.requests', 'Requests')}</span>
                    </NavLink>
                  </li>
                </>
              )}

              {/* Leader Navigation */}
              {isLeader && (
                <>
                  <li>
                    <NavLink to="/leader/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      <span>{t('nav.dashboard', 'Dashboard')}</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/leader/voters" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      <Users size={16} />
                      <span>{t('nav.all_voters', 'All Voters')}</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/leader/added-voters" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      <CheckCircle2 size={16} />
                      <span>{t('nav.added_voters', 'Added Voters')}</span>
                    </NavLink>
                  </li>
                </>
              )}

              {/* Commoner Navigation */}
              {isCommoner && (
                <li>
                  <NavLink to="/commoner/voters" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Users size={16} />
                    <span>{t('nav.voters', 'Voter Roll')}</span>
                  </NavLink>
                </li>
              )}
            </ul>
          </nav>

          <div className="header-actions">
            {/* Bilingual Switcher */}
            <button
              type="button"
              className="btn btn-secondary btn-sm lang-toggle-btn"
              onClick={toggleLanguage}
              title="Toggle Language / భాషను మార్చండి"
            >
              <span className="lang-text-desktop">🌐 {i18n.language === 'en' ? 'తెలుగు' : 'English'}</span>
              <span className="lang-text-mobile">🌐 {i18n.language === 'en' ? 'తెలుగు' : 'EN'}</span>
            </button>

            {/* Authenticated user menu vs Sign In button */}
            {user ? (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="user-profile-trigger"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileDropdownOpen(prev => !prev);
                  }}
                  title={`${user.full_name_en} (${user.role})`}
                  aria-expanded={profileDropdownOpen}
                >
                  <span className={`badge ${isSuperAdmin ? 'badge-danger' : isLeader ? 'badge-accent' : 'badge-primary'} user-role-badge`}>
                    <span className="role-text-desktop">{t(`roles.${user.role}`, user.role)}</span>
                    <span className="role-text-mobile">{isSuperAdmin ? 'Admin' : isLeader ? 'Leader' : 'Citizen'}</span>
                  </span>
                  <span className="user-name-desktop">
                    {user.full_name_en}
                  </span>
                  <ChevronDown size={14} className="user-chevron" />
                </button>

                {profileDropdownOpen && (
                  <>
                    <div
                      className="dropdown-backdrop"
                      onClick={() => setProfileDropdownOpen(false)}
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 9998,
                        background: 'transparent'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      minWidth: '220px',
                      background: '#ffffff',
                      borderRadius: '12px',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
                      border: '1px solid #e2e8f0',
                      zIndex: 9999,
                      overflow: 'hidden'
                    }}>
                      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{user.full_name_en}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.email}</div>
                      </div>

                      <Link
                        to={isSuperAdmin ? '/admin/settings' : isLeader ? '/leader/settings' : '/commoner/settings'}
                        onClick={() => setProfileDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.65rem 1rem',
                          fontSize: '0.85rem',
                          color: '#334155',
                          textDecoration: 'none'
                        }}
                      >
                        <Settings size={15} />
                        <span>{t('nav.settings', 'Settings')}</span>
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.65rem 1rem',
                          fontSize: '0.85rem',
                          color: '#dc2626',
                          background: 'none',
                          border: 'none',
                          width: '100%',
                          textAlign: 'left',
                          cursor: 'pointer',
                          borderTop: '1px solid #f1f5f9'
                        }}
                      >
                        <LogOut size={15} />
                        <span>{t('nav.logout', 'Sign Out')}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (authLoading || localStorage.getItem('ap_voters_token')) ? (
              <div
                className="skeleton"
                style={{
                  width: '76px',
                  height: '32px',
                  borderRadius: '8px',
                  flexShrink: 0
                }}
                aria-label="Loading..."
              />
            ) : (
              !isAuthPage && (
                <Link to="/login" className="btn btn-primary btn-sm" style={{ fontWeight: 600 }}>
                  <LogIn size={15} />
                  <span>{t('nav.login', 'Sign In')}</span>
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
