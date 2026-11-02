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
  const { t, i18n } = useTranslation();
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
  const isTelugu = i18n.language === 'te';

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Role Navigation">
      <div className="mobile-bottom-nav-inner">
        {/* Super Admin Navigation */}
        {isSuperAdmin && (
          <>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
              title={isTelugu ? 'డాష్‌బోర్డ్' : 'Dashboard'}
            >
              <div className="mobile-nav-icon-pill">
                <LayoutDashboard size={19} />
              </div>
              <span className="mobile-nav-label">{isTelugu ? 'డాష్‌బోర్డ్' : 'Dashboard'}</span>
            </NavLink>
            <NavLink
              to="/admin/constituencies"
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
              title={isTelugu ? 'నియోజకవర్గాలు' : 'Areas'}
            >
              <div className="mobile-nav-icon-pill">
                <Layers size={19} />
              </div>
              <span className="mobile-nav-label">{isTelugu ? 'ప్రాంతాలు' : 'Areas'}</span>
            </NavLink>
            <NavLink
              to="/admin/voters"
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
              title={isTelugu ? 'ఓటర్ల జాబితా' : 'Voters'}
            >
              <div className="mobile-nav-icon-pill">
                <Users size={19} />
              </div>
              <span className="mobile-nav-label">{isTelugu ? 'ఓటర్లు' : 'Voters'}</span>
            </NavLink>
            <NavLink
              to="/admin/imports"
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
              title={isTelugu ? 'దిగుమతులు' : 'Imports'}
            >
              <div className="mobile-nav-icon-pill">
                <UploadCloud size={19} />
              </div>
              <span className="mobile-nav-label">{isTelugu ? 'దిగుమతులు' : 'Imports'}</span>
            </NavLink>
            <NavLink
              to="/admin/access-requests"
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
              title={isTelugu ? 'అభ్యర్థనలు' : 'Requests'}
            >
              <div className="mobile-nav-icon-pill">
                <UserCheck size={19} />
              </div>
              <span className="mobile-nav-label">{isTelugu ? 'అభ్యర్థనలు' : 'Requests'}</span>
            </NavLink>
          </>
        )}

        {/* Leader Navigation */}
        {isLeader && (
          <>
            <NavLink
              to="/leader/dashboard"
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
              title={isTelugu ? 'డాష్‌బోర్డ్' : 'Dashboard'}
            >
              <div className="mobile-nav-icon-pill">
                <LayoutDashboard size={19} />
              </div>
              <span className="mobile-nav-label">{isTelugu ? 'డాష్‌బోర్డ్' : 'Dashboard'}</span>
            </NavLink>
            <NavLink
              to="/leader/voters"
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
              title={isTelugu ? 'ఓటరు డైరెక్టరీ' : 'Directory'}
            >
              <div className="mobile-nav-icon-pill">
                <Users size={19} />
              </div>
              <span className="mobile-nav-label">{isTelugu ? 'డైరెక్టరీ' : 'Directory'}</span>
            </NavLink>
            <NavLink
              to="/leader/added-voters"
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
              title={isTelugu ? 'చేర్చిన ఓటర్లు' : 'My Roster'}
            >
              <div className="mobile-nav-icon-pill">
                <CheckCircle2 size={19} />
              </div>
              <span className="mobile-nav-label">{isTelugu ? 'నా జాబితా' : 'My List'}</span>
            </NavLink>
            <NavLink
              to="/leader/settings"
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
              title={isTelugu ? 'సెట్టింగ్స్' : 'Settings'}
            >
              <div className="mobile-nav-icon-pill">
                <Settings size={19} />
              </div>
              <span className="mobile-nav-label">{isTelugu ? 'సెట్టింగ్స్' : 'Settings'}</span>
            </NavLink>
          </>
        )}

        {/* Commoner Navigation */}
        {isCommoner && (
          <>
            <NavLink
              to="/commoner/voters"
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
              title={isTelugu ? 'ఓటరు జాబితా' : 'Voters'}
            >
              <div className="mobile-nav-icon-pill">
                <Users size={19} />
              </div>
              <span className="mobile-nav-label">{isTelugu ? 'ఓటర్లు' : 'Voters'}</span>
            </NavLink>
            <NavLink
              to="/commoner/settings"
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
              title={isTelugu ? 'సెట్టింగ్స్' : 'Settings'}
            >
              <div className="mobile-nav-icon-pill">
                <Settings size={19} />
              </div>
              <span className="mobile-nav-label">{isTelugu ? 'సెట్టింగ్స్' : 'Settings'}</span>
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
