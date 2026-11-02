import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.js';
import { 
  ShieldCheck, 
  Layers, 
  Users, 
  UploadCloud, 
  UserCheck, 
  CheckCircle2, 
  Settings,
  LayoutDashboard
} from 'lucide-react';

export default function MobileBottomNav() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/sign-in' || location.pathname === '/sign-up';
  const isLandingPage = location.pathname === '/';

  // Do NOT show bottom navigation on public landing page or auth screens
  if (!user || isAuthPage || isLandingPage) {
    return null;
  }

  const isSuperAdmin = user.role === 'super_admin';
  const isLeader = user.role === 'leader';
  const isCommoner = user.role === 'commoner';

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Role Navigation">
      {/* Super Admin Navigation */}
      {isSuperAdmin && (
        <>
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            title={t('nav.dashboard', 'Dashboard')}
            aria-label={t('nav.dashboard', 'Dashboard')}
          >
            <LayoutDashboard size={18} />
          </NavLink>
          <NavLink
            to="/admin/constituencies"
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            title={t('nav.constituencies', 'Constituencies')}
            aria-label={t('nav.constituencies', 'Constituencies')}
          >
            <Layers size={18} />
          </NavLink>
          <NavLink
            to="/admin/voters"
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            title={t('nav.voters', 'All Voters')}
            aria-label={t('nav.voters', 'All Voters')}
          >
            <Users size={18} />
          </NavLink>
          <NavLink
            to="/admin/imports"
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            title={t('nav.imports', 'CSV Imports')}
            aria-label={t('nav.imports', 'CSV Imports')}
          >
            <UploadCloud size={18} />
          </NavLink>
          <NavLink
            to="/admin/access-requests"
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            title={t('nav.requests', 'Access Requests')}
            aria-label={t('nav.requests', 'Access Requests')}
          >
            <UserCheck size={18} />
          </NavLink>
        </>
      )}

      {/* Leader Navigation */}
      {isLeader && (
        <>
          <NavLink
            to="/leader/dashboard"
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            title={t('nav.dashboard', 'Dashboard')}
            aria-label={t('nav.dashboard', 'Dashboard')}
          >
            <LayoutDashboard size={18} />
          </NavLink>
          <NavLink
            to="/leader/voters"
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            title={t('nav.all_voters', 'Voter Directory')}
            aria-label={t('nav.all_voters', 'Voter Directory')}
          >
            <Users size={18} />
          </NavLink>
          <NavLink
            to="/leader/added-voters"
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            title={t('nav.added_voters', 'Added Voters')}
            aria-label={t('nav.added_voters', 'Added Voters')}
          >
            <CheckCircle2 size={18} />
          </NavLink>
          <NavLink
            to="/leader/settings"
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            title={t('nav.settings', 'Settings')}
            aria-label={t('nav.settings', 'Settings')}
          >
            <Settings size={18} />
          </NavLink>
        </>
      )}

      {/* Commoner Navigation */}
      {isCommoner && (
        <>
          <NavLink
            to="/commoner/voters"
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            title={t('nav.voters', 'Voter Roll')}
            aria-label={t('nav.voters', 'Voter Roll')}
          >
            <Users size={18} />
          </NavLink>
          <NavLink
            to="/commoner/settings"
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            title={t('nav.settings', 'Settings')}
            aria-label={t('nav.settings', 'Settings')}
          >
            <Settings size={18} />
          </NavLink>
        </>
      )}
    </nav>
  );
}
