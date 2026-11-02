import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, User, MapPin, Building, ShieldCheck, Tag, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';

export default function VoterDetailModal({ voter, isOpen, onClose, onUpdate, canEdit = true }) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [reviewStatus, setReviewStatus] = useState(voter?.review_status || 'approved');
  const [adminTag, setAdminTag] = useState(voter?.admin_tag || '');
  const [saving, setSaving] = useState(false);

  if (!isOpen || !voter) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.updateVoterReview(voter.id, {
        review_status: reviewStatus,
        admin_tag: adminTag
      });
      if (res.success) {
        showToast('Voter review status updated', 'success');
        if (onUpdate) onUpdate(res.data);
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update review status', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>{t('voter_modal.title')}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Part {voter.part_number} • Serial #{voter.serial_number}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Bilingual Name Header Box */}
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('voter_modal.name_en')}
              </span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--secondary)' }}>
                {voter.name_en}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('voter_modal.name_te')}
              </span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                {voter.name_te}
              </div>
            </div>
          </div>

          {/* Demographic & House Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ padding: '0.85rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('voter_modal.relative')} ({voter.relative_type})
              </span>
              <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>
                {voter.relative_name_en}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {voter.relative_name_te}
              </div>
            </div>

            <div className="card" style={{ padding: '0.85rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('voter_modal.house_no')}
              </span>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: '0.2rem' }}>
                {voter.house_number_en}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {voter.house_number_te}
              </div>
            </div>

            <div className="card" style={{ padding: '0.85rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Age & Gender
              </span>
              <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>
                {voter.age} Yrs • {voter.gender === 'M' ? t('directory.male') : t('directory.female')}
              </div>
              <div style={{ marginTop: '0.3rem' }}>
                <span className="badge badge-secondary">{voter.admin_tag || 'General'}</span>
              </div>
            </div>

            <div className="card" style={{ padding: '0.85rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('voter_modal.epic')}
              </span>
              <div style={{ fontWeight: 700, letterSpacing: '0.05em', color: 'var(--secondary)', marginTop: '0.2rem' }}>
                {voter.epic_number_masked || 'AP07***PROTECTED'}
              </div>
              <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}>
                <ShieldCheck size={12} /> Masked for privacy
              </span>
            </div>
          </div>

          {/* Polling Station and Booth Part Information */}
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
              Polling Booth & Location Details
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} color="var(--primary)" />
                <span><strong>Part {voter.part_number}:</strong> {i18n.language === 'te' ? voter.part_name_te : voter.part_name_en}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={16} color="var(--accent)" />
                <span>Source File: <code>{voter.source_file || 'AP_Roll_2024.pdf'}</code> (Page {voter.source_page || 1})</span>
              </div>
            </div>
          </div>

          {/* Administrative Review Status (for Leaders & Admins) */}
          {canEdit && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.8rem', color: 'var(--secondary)' }}>
                Update Verification Status
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('voter_modal.review_status')}</label>
                  <select
                    className="form-control"
                    value={reviewStatus}
                    onChange={e => setReviewStatus(e.target.value)}
                  >
                    <option value="approved">{t('directory.approved')}</option>
                    <option value="needs_review">{t('directory.needs_review')}</option>
                    <option value="flagged">{t('directory.flagged')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('voter_modal.tag')}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={adminTag}
                    onChange={e => setAdminTag(e.target.value)}
                    placeholder="e.g. Senior Citizen, PWD, Resident"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            {t('voter_modal.close')}
          </button>
          {canEdit && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={saving}
            >
              <CheckCircle2 size={16} />
              {saving ? 'Saving...' : t('common.save')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
