import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const { t, i18n } = useTranslation();
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isTelugu = i18n.language === 'te';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullNameEn, setFullNameEn] = useState('');
  const [fullNameTe, setFullNameTe] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await register({
        email,
        password,
        full_name_en: fullNameEn,
        full_name_te: fullNameTe,
        phone
      });
      if (res.success) {
        showToast(
          t('auth.registration_success', isTelugu ? 'నమోదు విజయవంతమైంది' : 'Registration successful'),
          'success'
        );
        navigate('/commoner/voters');
      }
    } catch (err) {
      showToast(
        err.message || t('auth.registration_failed', isTelugu ? 'నమోదు విఫలమైంది' : 'Registration failed'),
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto', width: '100%', padding: '0 1rem' }}>
      <div className="card" style={{ padding: '2rem', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #065f46 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem',
            boxShadow: '0 6px 16px rgba(4, 120, 87, 0.25)'
          }}>
            <UserPlus size={24} />
          </div>
          <h2 style={{ fontSize: '1.45rem', color: '#0f172a', fontWeight: 800, margin: '0 0 0.25rem' }}>
            {t('auth.register_title', isTelugu ? 'పౌరుల నమోదు (రిజిస్ట్రేషన్)' : 'Citizen Registration')}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            {t('auth.register_subtitle', isTelugu ? 'పౌర పోర్టల్ ఖాతాను సృష్టించండి' : 'Create citizen portal account')}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Full Name in English */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {t('auth.full_name_en', isTelugu ? 'పూర్తి పేరు (ఇంగ్లీష్‌లో)' : 'Full Name (English)')} *
            </label>
            <input
              type="text"
              className="form-control"
              value={fullNameEn}
              onChange={e => setFullNameEn(e.target.value)}
              placeholder={t('auth.full_name_en_placeholder', isTelugu ? 'ఉదా: S. Venkatesh' : 'e.g. S. Venkatesh')}
              required
            />
          </div>

          {/* Full Name in Telugu (Optional) */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {t('auth.full_name_te', isTelugu ? 'పూర్తి పేరు (తెలుగులో - ఐచ్ఛికం)' : 'Full Name (Telugu - Optional)')}
            </label>
            <input
              type="text"
              className="form-control"
              value={fullNameTe}
              onChange={e => setFullNameTe(e.target.value)}
              placeholder={t('auth.full_name_te_placeholder', isTelugu ? 'ఉదాహరణ: ఎస్. వెంకటేష్' : 'e.g. ఎస్. వెంకటేష్')}
            />
          </div>

          {/* Email Address */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {t('auth.email', isTelugu ? 'ఈమెయిల్ చిరునామా' : 'Email Address')} *
            </label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('auth.email_placeholder', isTelugu ? 'మీ ఈమెయిల్ (e.g. voter@apvoters.gov.in)' : 'you@example.com')}
              required
            />
          </div>

          {/* Phone Number */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {t('auth.phone', isTelugu ? 'ఫోన్ నంబర్ (ఐచ్ఛికం)' : 'Phone Number (Optional)')}
            </label>
            <input
              type="tel"
              className="form-control"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={t('auth.phone_placeholder', '9848012345')}
            />
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {t('auth.password', isTelugu ? 'పాస్‌వర్డ్ (కనీసం 6 అక్షరాలు)' : 'Password (min 6 characters)')} *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? (isTelugu ? 'పాస్‌వర్డ్ దాచు' : 'Hide password') : (isTelugu ? 'పాస్‌వర్డ్ చూపు' : 'Show password')}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontWeight: 700 }}
            disabled={loading}
          >
            {loading 
              ? t('auth.creating_account', isTelugu ? 'ఖాతా సృష్టించబడుతోంది...' : 'Creating Account...') 
              : t('auth.create_account', isTelugu ? 'ఖాతాను సృష్టించండి (Register)' : 'Create Citizen Account')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
          {t('auth.already_have_account', isTelugu ? 'ఇప్పటికే ఖాతా ఉందా?' : 'Already have an account?')}{' '}
          <Link to="/login" style={{ fontWeight: 700, color: 'var(--primary)' }}>
            {t('auth.sign_in_link', isTelugu ? 'ఇక్కడ లాగిన్ అవ్వండి' : 'Sign In Here')}
          </Link>
        </div>
      </div>
    </div>
  );
}
