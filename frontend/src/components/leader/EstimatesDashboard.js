import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { BarChart3, AlertTriangle, CheckCircle2, ShieldAlert, Info, Save } from 'lucide-react';
import SkeletonLoader from '../common/SkeletonLoader.js';

export default function EstimatesDashboard() {
  const { t, i18n } = useTranslation();
  const { selectedConstituency, user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [parties, setParties] = useState([]);
  const [estimateData, setEstimateData] = useState(null);
  const [counts, setCounts] = useState({});
  const [notes, setNotes] = useState({});
  const [savingPartyId, setSavingPartyId] = useState(null);

  const constituencyId = selectedConstituency?.id || 'c1111111-0000-0000-0000-000000000001';

  const loadData = async () => {
    setLoading(true);
    try {
      const [partyRes, estRes] = await Promise.all([
        api.getParties(),
        api.getLeaderEstimates(constituencyId)
      ]);

      if (partyRes.success) {
        setParties(partyRes.data);
      }

      if (estRes.success) {
        setEstimateData(estRes.data);
        const countMap = {};
        const noteMap = {};
        estRes.data.estimates.forEach(e => {
          countMap[e.party_id] = e.estimated_count;
          noteMap[e.party_id] = e.notes || '';
        });
        setCounts(countMap);
        setNotes(noteMap);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load estimates', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [constituencyId]);

  const handleSaveEstimate = async (partyId) => {
    setSavingPartyId(partyId);
    try {
      const estimatedCount = Number(counts[partyId]) || 0;
      const res = await api.saveLeaderEstimate({
        constituency_id: constituencyId,
        party_id: partyId,
        estimated_count: estimatedCount,
        notes: notes[partyId] || ''
      });

      if (res.success) {
        showToast(t('common.success'), 'success');
        if (res.warning) {
          showToast(res.warning, 'warning', 6000);
        }
        await loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to save estimate', 'error');
    } finally {
      setSavingPartyId(null);
    }
  };

  if (loading) {
    return <SkeletonLoader rows={4} height="5rem" />;
  }

  const totalElectors = estimateData?.total_electors || 3000;
  const currentTotalEntered = estimateData?.total_estimated_count || 0;
  const unallocated = estimateData?.unallocated_count || 0;
  const exceeds = estimateData?.exceeds_total_electors;
  const percentageAllocated = Math.min(100, Math.round((currentTotalEntered / totalElectors) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner Notice */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#fff',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <BarChart3 size={24} color="#34d399" />
          <h2 style={{ color: '#fff', fontSize: '1.35rem' }}>{t('leader.estimates_title')}</h2>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', maxWidth: '800px', lineHeight: 1.6 }}>
          {t('leader.estimates_desc')}
        </p>
      </div>

      {/* Warning Alert Banner (if entered total exceeds total registered voters) */}
      {exceeds && (
        <div style={{
          background: 'var(--danger-light)',
          border: '1px solid #f87171',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          color: '#991b1b',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <ShieldAlert size={24} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700 }}>{t('leader.exceeds_warning')}</div>
            <div style={{ fontSize: '0.85rem' }}>{estimateData.warning_message}</div>
          </div>
        </div>
      )}

      {/* Overview Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {t('leader.elector_base')}
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '0.25rem' }}>
            {totalElectors.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Roll Electors</span>
        </div>

        <div className="card" style={{ borderLeft: `4px solid ${exceeds ? 'var(--danger)' : 'var(--accent)'}` }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {t('leader.total_entered')}
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: exceeds ? 'var(--danger)' : 'var(--accent)', marginTop: '0.25rem' }}>
            {currentTotalEntered.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.75rem', color: exceeds ? 'var(--danger)' : 'var(--text-muted)' }}>
            {percentageAllocated}% of Constituency Elector Base
          </span>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #64748b' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {t('leader.unallocated')}
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#64748b', marginTop: '0.25rem' }}>
            {unallocated.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unclassified Margin</span>
        </div>
      </div>

      {/* Visual Multi-Party Proportional Distribution Bar */}
      <div className="card">
        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.85rem', color: 'var(--secondary)' }}>
          Constituency Aggregate Projection Breakdown
        </h4>
        <div style={{
          width: '100%',
          height: '24px',
          background: '#e2e8f0',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          display: 'flex',
          marginBottom: '1rem'
        }}>
          {parties.map(p => {
            const count = counts[p.id] || 0;
            const pct = totalElectors > 0 ? (count / totalElectors) * 100 : 0;
            if (pct <= 0) return null;
            return (
              <div
                key={p.id}
                style={{
                  width: `${pct}%`,
                  background: p.color_code || '#64748b',
                  height: '100%',
                  transition: 'width 0.4s ease'
                }}
                title={`${p.abbreviation}: ${count} (${Math.round(pct)}%)`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.825rem' }}>
          {parties.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: p.color_code || '#64748b' }} />
              <span style={{ fontWeight: 600 }}>{p.abbreviation}:</span>
              <span>{counts[p.id] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Party Entry Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {parties.map(party => {
          const isSaving = savingPartyId === party.id;
          const currentCount = counts[party.id] || 0;

          return (
            <div key={party.id} className="card" style={{ borderTop: `4px solid ${party.color_code || 'var(--primary)'}` }}>
              <div className="card-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--secondary)' }}>
                    {party.abbreviation}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {i18n.language === 'te' ? party.name_te : party.name_en}
                  </div>
                </div>
                <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                  {party.symbol_name}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">{t('leader.estimated_count')}</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  style={{ fontSize: '1.15rem', fontWeight: 700 }}
                  value={counts[party.id] !== undefined ? counts[party.id] : ''}
                  onChange={e => {
                    const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                    setCounts(prev => ({ ...prev, [party.id]: val }));
                  }}
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('leader.notes')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={notes[party.id] || ''}
                  onChange={e => setNotes(prev => ({ ...prev, [party.id]: e.target.value }))}
                  placeholder="e.g. Campaign feedback, booth volunteer assessment"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleSaveEstimate(party.id)}
                  disabled={isSaving}
                >
                  <Save size={15} />
                  {isSaving ? 'Saving...' : t('leader.save_estimate')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
