import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { MapPin, Building, Plus, Check } from 'lucide-react';
import SkeletonLoader from '../common/SkeletonLoader.js';

export default function GeographyManager() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();

  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGeo = async () => {
    setLoading(true);
    try {
      const [distRes, mandRes, constRes] = await Promise.all([
        api.getDistricts(),
        api.getMandals(),
        api.getConstituencies()
      ]);

      if (distRes.success) setDistricts(distRes.data);
      if (mandRes.success) setMandals(mandRes.data);
      if (constRes.success) setConstituencies(constRes.data);
    } catch (err) {
      showToast(err.message || 'Failed to load geography structure', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGeo();
  }, []);

  if (loading) return <SkeletonLoader rows={4} height="4rem" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <div className="card-header">
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--secondary)' }}>
              Geographic Hierarchy & MPTC Constituencies
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Structured mapping: District → Mandal → Village/Area → MPTC Constituency → Roll Part
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {/* MPTC Constituencies Box */}
          <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={18} color="var(--primary)" /> MPTC Constituencies
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {constituencies.map(c => (
                <div key={c.id} style={{
                  padding: '0.75rem',
                  background: '#f8fafc',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>{c.name_en}</div>
                  <div style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>{c.name_te}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Code: <code>{c.code}</code> • Category: {c.reservation_category}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mandals Box */}
          <div className="card" style={{ borderTop: '4px solid var(--accent)' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building size={18} color="var(--accent)" /> Mandals
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {mandals.map(m => (
                <div key={m.id} style={{
                  padding: '0.75rem',
                  background: '#f8fafc',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>{m.name_en} Mandal</div>
                  <div style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>{m.name_te} మండలం</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Code: <code>{m.code}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Districts Box */}
          <div className="card" style={{ borderTop: '4px solid #64748b' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building size={18} color="#64748b" /> Districts
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {districts.map(d => (
                <div key={d.id} style={{
                  padding: '0.75rem',
                  background: '#f8fafc',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>{d.name_en} District</div>
                  <div style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>{d.name_te} జిల్లా</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Code: <code>{d.code}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
