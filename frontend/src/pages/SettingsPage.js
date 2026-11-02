import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { 
  Settings, 
  User, 
  Globe2, 
  LogOut, 
  ShieldCheck, 
  CheckCircle2, 
  MapPin,
  Mail,
  Phone
} from 'lucide-react';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, logout, selectedConstituency } = useAuth();
  const navigate = useNavigate();

  const [savedMsg, setSavedMsg] = useState(null);

  const isTelugu = i18n.language === 'te';

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('ap_voters_lang', lang);
    setSavedMsg(isTelugu ? 'భాషా ప్రాధాన్యత నవీకరించబడింది.' : 'Language preference updated.');
    setTimeout(() => setSavedMsg(null), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="settings-page" style={{ paddingBottom: '3.5rem', maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">
          {isTelugu ? 'వినియోగదారు సెట్టింగ్‌లు' : 'Account & System Settings'}
        </h1>
        <p className="page-subtitle">
          {isTelugu ? 'మీ ప్రొఫైల్ వివరాలు, భాషా ప్రాధాన్యత మరియు ఖాతా నిర్వహణ.' : 'Manage your profile details, language preference, and active session.'}
        </p>
      </div>

      {savedMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          {savedMsg}
        </div>
      )}

      {/* Profile Details Card */}
      <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', background: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: '#e0f2fe',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <User size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
              {user.full_name_en}
            </h3>
            <span className={`badge ${user.role === 'super_admin' ? 'badge-danger' : user.role === 'leader' ? 'badge-accent' : 'badge-primary'}`}>
              {t(`roles.${user.role}`, user.role)}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>EMAIL ADDRESS</div>
            <div style={{ fontSize: '0.92rem', color: '#0f172a', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Mail size={14} color="#64748b" />
              <span>{user.email}</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>PHONE NUMBER</div>
            <div style={{ fontSize: '0.92rem', color: '#0f172a', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Phone size={14} color="#64748b" />
              <span>{user.phone || 'Not provided'}</span>
            </div>
          </div>

          {selectedConstituency && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CURRENT SAVED CONSTITUENCY</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#4338ca', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={15} />
                <span>
                  {isTelugu && selectedConstituency.name_te ? selectedConstituency.name_te : selectedConstituency.name_en}
                  {' • '}{selectedConstituency.district_name_en}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Language Preference Card */}
      <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', background: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: '#ede9fe',
            color: '#7c3aed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Globe2 size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>
              {isTelugu ? 'భాషా ప్రాధాన్యత' : 'Display Language'}
            </h3>
            <p style={{ margin: '0.15rem 0 0', color: '#64748b', fontSize: '0.82rem' }}>
              Select between English and Telugu interface
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn ${i18n.language === 'en' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleLanguageChange('en')}
            style={{ minWidth: '130px', fontWeight: 600 }}
          >
            English
          </button>
          <button
            type="button"
            className={`btn ${i18n.language === 'te' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleLanguageChange('te')}
            style={{ minWidth: '130px', fontWeight: 600 }}
          >
            తెలుగు (Telugu)
          </button>
        </div>
      </div>

      {/* Sign Out Card */}
      <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #fee2e2', background: '#fff5f5' }}>
        <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', color: '#dc2626', fontWeight: 700 }}>
          {isTelugu ? 'ఖాతా నుండి నిష్క్రమించండి' : 'Sign Out Session'}
        </h3>
        <p style={{ margin: '0 0 1rem', color: '#7f1d1d', fontSize: '0.85rem' }}>
          {isTelugu ? 'మీ ప్రస్తుత సెషన్‌ను ముగించి హోమ్ పేజీకి వెళ్లండి.' : 'Safely end your authenticated session on this device.'}
        </p>

        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={handleLogout}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
        >
          <LogOut size={16} />
          <span>{isTelugu ? 'లాగౌట్ అవ్వండి (Sign Out)' : 'Sign Out'}</span>
        </button>
      </div>
    </div>
  );
}
