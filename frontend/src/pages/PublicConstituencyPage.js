import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js';
import { MapPin, Users, Building, ShieldCheck, Award, ArrowLeft } from 'lucide-react';
import SkeletonLoader from '../components/common/SkeletonLoader.js';

export default function PublicConstituencyPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const [constituency, setConstituency] = useState(null);
  const [loading, setLoading] = useState(true);

  const constId = id || 'c1111111-0000-0000-0000-000000000001';

  useEffect(() => {
    async function fetchInfo() {
      setLoading(true);
      try {
        const res = await api.getPublicConstituencyInfo(constId);
        if (res.success) {
          setConstituency(res.data);
        }
      } catch (err) {
        console.error('Failed to load constituency info:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchInfo();
  }, [constId]);

  if (loading) return <SkeletonLoader type="page" />;

  if (!constituency) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Constituency profile not found.</p>
        <Link to="/" className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <ArrowLeft size={16} /> Back to Home
      </Link>

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #047857 0%, #0f172a 100%)',
        color: '#fff',
        padding: '2.25rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <MapPin size={24} color="#fbbf24" />
          <span style={{ color: '#a7f3d0', fontSize: '0.85rem', fontWeight: 600 }}>
            {constituency.district_name_en} District • {constituency.mandal_name_en} Mandal
          </span>
        </div>

        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 800 }}>
          {constituency.name_en}
        </h1>
        <div style={{ fontSize: '1.25rem', color: '#a7f3d0', fontWeight: 600, marginTop: '0.2rem' }}>
          {constituency.name_te}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <span className="badge badge-secondary" style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#fff' }}>
            Code: {constituency.code}
          </span>
          <span className="badge badge-secondary" style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#fff' }}>
            Reservation: {constituency.reservation_category}
          </span>
          <span className="badge badge-secondary" style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#fff' }}>
            {constituency.total_electors?.toLocaleString() || 3000} Electors
          </span>
        </div>
      </div>

      {/* Official 2024 Candidates Profile */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <Award size={22} color="var(--primary)" />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--secondary)' }}>
            Official Candidates (MPTC General Elections)
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {constituency.candidates?.map((candidate, i) => (
            <div
              key={i}
              style={{
                border: '1px solid var(--border)',
                borderTop: `4px solid ${candidate.color_code || 'var(--primary)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                background: '#f8fafc'
              }}
            >
              <span className="badge badge-secondary" style={{ marginBottom: '0.5rem' }}>
                {candidate.party_name_en}
              </span>
              <h4 style={{ fontSize: '1.15rem', color: 'var(--secondary)', fontWeight: 700 }}>
                {candidate.name_en}
              </h4>
              <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.95rem' }}>
                {candidate.name_te}
              </div>

              <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Symbol: <strong>{candidate.symbol_name}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
