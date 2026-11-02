import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  const { t, i18n } = useTranslation();
  const isTelugu = i18n.language === 'te';

  return (
    <div style={{
      padding: '4rem 1.5rem',
      textAlign: 'center',
      maxWidth: '520px',
      margin: '0 auto'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '20px',
        background: '#fee2e2',
        color: '#dc2626',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.25rem'
      }}>
        <ShieldAlert size={36} />
      </div>

      <h1 className="page-title" style={{ marginBottom: '0.75rem', textAlign: 'center' }}>
        {isTelugu ? 'అనుమతి నిరాకరించబడింది (403)' : 'Access Unauthorized (403)'}
      </h1>

      <p className="page-subtitle" style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem', textAlign: 'center' }}>
        {isTelugu
          ? 'మీరు వీక్షించడానికి ప్రయత్నిస్తున్న పేజీకి మీ పాత్రకు అనుమతి లేదు. దయచేసి సరైన ఖాతాతో ప్రవేశించండి లేదా హోమ్ పేజీకి వెళ్లండి.'
          : 'You do not have the required permissions to access this protected administrative route. Please sign in with an authorized account.'}
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link to="/" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
          <Home size={16} />
          <span>{isTelugu ? 'హోమ్ పేజీకి వెళ్లండి' : 'Return to Home'}</span>
        </Link>
      </div>
    </div>
  );
}
