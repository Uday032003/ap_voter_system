import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-inner">
          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.25rem' }}>
              {t('app.title')}
            </h4>
            <p style={{ maxWidth: '480px', fontSize: '0.8rem', color: '#94a3b8' }}>
              {t('app.subtitle')} — Designed for electoral-roll records management and constituency verification across Andhra Pradesh.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1' }}>
              <ShieldCheck size={18} color="#10b981" />
              <span>Row-Level Security & Role Protected</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              © {new Date().getFullYear()} AP Voter Directory. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
