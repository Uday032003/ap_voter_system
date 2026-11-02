import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { MapPin, Edit3, CheckCircle2, AlertCircle, ChevronRight, Layers } from 'lucide-react';

export default function ConstituencySelector({ onSelectionConfirmed, showBannerOnly = false }) {
  const { t, i18n } = useTranslation();
  const { user, selectedConstituency, setSelectedConstituency, refreshUserSelection } = useAuth();

  const [districts, setDistricts] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [mptcs, setMptcs] = useState([]);

  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedAssemblyId, setSelectedAssemblyId] = useState('');
  const [selectedMptcId, setSelectedMptcId] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isLeader = user?.role === 'leader';
  const isTelugu = i18n.language === 'te';

  // Load districts on mount
  useEffect(() => {
    async function fetchDistricts() {
      try {
        setLoading(true);
        const res = await api.getDistricts();
        if (res.success) {
          setDistricts(res.data || []);
        }
      } catch (err) {
        setError(err.message || 'Failed to load districts');
      } finally {
        setLoading(false);
      }
    }
    fetchDistricts();
  }, []);

  // When district changes, reset child selections and fetch assembly constituencies
  useEffect(() => {
    if (!selectedDistrictId) {
      setAssemblies([]);
      setSelectedAssemblyId('');
      setMptcs([]);
      setSelectedMptcId('');
      return;
    }

    async function fetchAssemblies() {
      try {
        const res = await api.getAssemblies(selectedDistrictId);
        if (res.success) {
          setAssemblies(res.data || []);
          setSelectedAssemblyId('');
          setMptcs([]);
          setSelectedMptcId('');
        }
      } catch (err) {
        setError(err.message || 'Failed to load assembly constituencies');
      }
    }
    fetchAssemblies();
  }, [selectedDistrictId]);

  // When assembly changes, reset MPTC and fetch MPTCs
  useEffect(() => {
    if (!selectedAssemblyId) {
      setMptcs([]);
      setSelectedMptcId('');
      return;
    }

    async function fetchMptcs() {
      try {
        const res = await api.getMptcs(selectedAssemblyId);
        if (res.success) {
          setMptcs(res.data || []);
          setSelectedMptcId('');
        }
      } catch (err) {
        setError(err.message || 'Failed to load MPTC village constituencies');
      }
    }
    fetchMptcs();
  }, [selectedAssemblyId]);

  const handleConfirm = async (e) => {
    e?.preventDefault();
    if (!selectedMptcId) {
      setError('Please select an MPTC Village Constituency.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await api.saveUserConstituencySelection(selectedMptcId);
      await refreshUserSelection();
      setIsEditing(false);
      if (onSelectionConfirmed) {
        onSelectionConfirmed(selectedMptcId);
      }
    } catch (err) {
      setError(err.message || 'Failed to save constituency selection.');
    } finally {
      setSaving(false);
    }
  };

  // If user has a saved selection and we are not in editing mode, show the active banner with "Edit Selection"
  if (selectedConstituency && !isEditing) {
    return (
      <div className="card active-constituency-banner" style={{
        marginBottom: '1.25rem',
        padding: '1rem 1.25rem',
        background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.95), rgba(224, 231, 255, 0.95))',
        border: '1px solid #c7d2fe',
        borderRadius: '12px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: '#4f46e5',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <MapPin size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('constituency.current_selection', 'Selected Constituency')} • AP
            </div>
            <div style={{ fontSize: 'clamp(0.88rem, 2.5vw, 1.05rem)', fontWeight: 700, color: '#1e1b4b', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
              <span>{isTelugu && selectedConstituency.district_name_te ? selectedConstituency.district_name_te : selectedConstituency.district_name_en}</span>
              <ChevronRight size={14} color="#6366f1" />
              <span>{isTelugu && selectedConstituency.assembly_name_te ? selectedConstituency.assembly_name_te : selectedConstituency.assembly_name_en}</span>
              <ChevronRight size={14} color="#6366f1" />
              <span style={{ color: '#4338ca' }}>{isTelugu && selectedConstituency.name_te ? selectedConstituency.name_te : selectedConstituency.name_en}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setIsEditing(true);
            setSelectedDistrictId('');
            setSelectedAssemblyId('');
            setSelectedMptcId('');
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
        >
          <Edit3 size={15} />
          {t('constituency.edit_selection', 'Edit Selection')}
        </button>
      </div>
    );
  }

  return (
    <div className="card constituency-selector-card" style={{
      marginBottom: '1.5rem',
      padding: '1.5rem',
      borderRadius: '14px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
      background: '#ffffff'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: '#0284c7',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Layers size={20} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>
            {selectedConstituency ? t('constituency.change_title', 'Change Constituency') : t('constituency.select_title', 'Select Your Constituency')}
          </h3>
          <p style={{ margin: '0.15rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            State (AP) → District → Assembly Constituency → MPTC Village Constituency
          </p>
        </div>
      </div>

      {isLeader && (
        <div style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          borderRadius: '8px',
          background: '#fffbeb',
          border: '1px solid #fde68a',
          fontSize: '0.85rem',
          color: '#92400e',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>{t('constituency.leader_approval_note_title', 'Leader Approval Required:')}</strong>{' '}
            {t('constituency.leader_approval_note', 'Selecting or switching to a new constituency requires Super Admin approval before protected voter data becomes accessible.')}
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleConfirm}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}>
          {/* Step 1: Fixed State */}
          <div className="form-group">
            <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>
              1. {t('constituency.state', 'State')}
            </label>
            <input
              type="text"
              className="form-control"
              value={isTelugu ? 'ఆంధ్రప్రదేశ్ (AP)' : 'Andhra Pradesh (AP)'}
              disabled
              style={{ background: '#f8fafc', color: '#334155', fontWeight: 600 }}
            />
          </div>

          {/* Step 2: District */}
          <div className="form-group">
            <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>
              2. {t('constituency.district', 'District')} *
            </label>
            <select
              className="form-control"
              value={selectedDistrictId}
              onChange={(e) => setSelectedDistrictId(e.target.value)}
              required
            >
              <option value="">-- {t('constituency.choose_district', 'Select District')} --</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {isTelugu && d.name_te ? `${d.name_te} (${d.name_en})` : d.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Assembly Constituency */}
          <div className="form-group">
            <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>
              3. {t('constituency.assembly', 'Assembly Constituency')} *
            </label>
            <select
              className="form-control"
              value={selectedAssemblyId}
              onChange={(e) => setSelectedAssemblyId(e.target.value)}
              disabled={!selectedDistrictId || assemblies.length === 0}
              required
            >
              <option value="">-- {t('constituency.choose_assembly', 'Select Assembly')} --</option>
              {assemblies.map((a) => (
                <option key={a.id} value={a.id}>
                  {isTelugu && a.name_te ? `${a.name_te} (${a.name_en})` : a.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Step 4: MPTC Village Constituency */}
          <div className="form-group">
            <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>
              4. {t('constituency.mptc', 'MPTC Village Constituency')} *
            </label>
            <select
              className="form-control"
              value={selectedMptcId}
              onChange={(e) => setSelectedMptcId(e.target.value)}
              disabled={!selectedAssemblyId || mptcs.length === 0}
              required
            >
              <option value="">-- {t('constituency.choose_mptc', 'Select MPTC Village')} --</option>
              {mptcs.map((m) => (
                <option key={m.id} value={m.id}>
                  {isTelugu && m.name_te ? `${m.name_te} (${m.name_en})` : m.name_en}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {selectedConstituency && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditing(false)}
              disabled={saving}
            >
              {t('common.cancel', 'Cancel')}
            </button>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!selectedMptcId || saving}
            style={{ minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            {saving ? (
              <span>Saving...</span>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>{isLeader ? t('constituency.select_and_request', 'Select & Proceed') : t('constituency.confirm_selection', 'Confirm Selection')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
