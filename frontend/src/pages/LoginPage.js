import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isTelugu = i18n.language === 'te';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        showToast(isTelugu ? 'లాగిన్ విజయవంతమైంది' : 'Successfully authenticated', 'success');
        if (res.user.role === 'super_admin') navigate('/admin/dashboard');
        else if (res.user.role === 'leader') navigate('/leader/dashboard');
        else navigate('/commoner/voters');
      }
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '2.5rem auto', width: '100%', padding: '0 1rem' }}>
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
            <LogIn size={26} />
          </div>
          <h2 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: 800, margin: '0 0 0.25rem' }}>
            {isTelugu ? 'లాగిన్ అవ్వండి' : 'Sign In'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            {isTelugu ? 'ఆంధ్రప్రదేశ్ ఓటరు డైరెక్టరీ పోర్టల్' : 'Access Andhra Pradesh Electoral Directory'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {isTelugu ? 'ఈమెయిల్ చిరునామా' : 'Email Address'} *
            </label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. admin@apvoters.gov.in"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {isTelugu ? 'పాస్‌వర్డ్' : 'Password'} *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
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

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontWeight: 700 }}
            disabled={loading}
          >
            {loading ? (isTelugu ? 'ధృవీకరిస్తోంది...' : 'Authenticating...') : (isTelugu ? 'సైన్ ఇన్ (Sign In)' : 'Sign In')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
          {isTelugu ? 'ఖాతా లేదా?' : "Don't have an account?"}{' '}
          <Link to="/register" style={{ fontWeight: 700, color: 'var(--primary)' }}>
            {isTelugu ? 'ఇక్కడ నమోదు చేసుకోండి' : 'Register Here'}
          </Link>
        </div>
      </div>
    </div>
  );
}
