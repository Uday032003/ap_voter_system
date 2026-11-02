import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, CheckCircle2, Circle, AlertTriangle, AlertCircle, Check } from 'lucide-react';
import VoterCard from './VoterCard.js';

export default function VoterTable({
  records,
  selectedIds = [],
  onToggleSelect,
  onSelectAllPage,
  onViewDetails,
  onToggleMark,
  canSelect = true,
  canMark = true,
  isLeader = false
}) {
  const { t, i18n } = useTranslation();

  const isAllPageSelected = records.length > 0 && records.every(r => selectedIds.includes(r.id));
  const isSomePageSelected = records.some(r => selectedIds.includes(r.id)) && !isAllPageSelected;

  if (records.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>
          {t('directory.no_records', 'No matching voter records found.')}
        </div>
      </div>
    );
  }

  return (
    <div className="voter-list-container">
      {/* Mobile Card List (Visible on mobile/tablet <= 768px) */}
      <div className="mobile-cards-view">
        {records.map(voter => (
          <VoterCard
            key={voter.id}
            voter={voter}
            isSelected={selectedIds.includes(voter.id)}
            onToggleSelect={onToggleSelect}
            onToggleMark={onToggleMark}
            onViewDetails={onViewDetails}
            canSelect={canSelect}
            canMark={canMark}
            isLeader={isLeader}
          />
        ))}
      </div>

      {/* Desktop Table View (Visible on desktop > 768px) */}
      <div className="desktop-table-view table-responsive">
        <table className="table">
          <thead>
            <tr>
              {isLeader && canMark && (
                <th style={{ width: '48px', textAlign: 'center' }} title="Leader Workspace Mark">
                  <Check size={16} />
                </th>
              )}
              {canSelect && (
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    ref={el => { if (el) el.indeterminate = isSomePageSelected; }}
                    onChange={e => onSelectAllPage && onSelectAllPage(e.target.checked)}
                    aria-label="Select all on this page"
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                </th>
              )}
              <th style={{ width: '70px' }}>{t('directory.serial')}</th>
              <th>{t('directory.voter_name')}</th>
              <th>{t('directory.relative_name')}</th>
              <th>{t('directory.house_no')}</th>
              <th>{t('directory.age')} / {t('directory.gender')}</th>
              <th>{t('directory.part_station')}</th>
              <th>{t('directory.status')}</th>
              <th style={{ textAlign: 'right' }}>{t('directory.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {records.map(voter => {
              const isSelected = selectedIds.includes(voter.id);
              const isMarked = Boolean(voter.is_marked);

              let statusBadge = 'badge-success';
              let StatusIcon = CheckCircle2;
              if (voter.review_status === 'needs_review') {
                statusBadge = 'badge-warning';
                StatusIcon = AlertTriangle;
              } else if (voter.review_status === 'flagged') {
                statusBadge = 'badge-danger';
                StatusIcon = AlertCircle;
              }

              return (
                <tr key={voter.id} className={`${isSelected ? 'selected' : ''} ${isMarked ? 'marked-row' : ''}`}>
                  {/* Per-Voter Mark Button (Desktop) */}
                  {isLeader && canMark && (
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className={`touch-mark-btn ${isMarked ? 'marked' : 'unmarked'}`}
                        style={{ width: '36px', height: '36px', margin: '0 auto' }}
                        onClick={() => onToggleMark && onToggleMark(voter)}
                        title={isMarked ? t('directory.unmark_action', 'Unmark from Leader Workspace') : t('directory.mark_action', 'Mark for Leader Workspace')}
                        aria-label={isMarked ? `Unmark voter #${voter.serial_number}` : `Mark voter #${voter.serial_number}`}
                        aria-pressed={isMarked}
                      >
                        {isMarked ? (
                          <CheckCircle2 size={18} className="mark-icon-active" />
                        ) : (
                          <Circle size={18} className="mark-icon-inactive" />
                        )}
                      </button>
                    </td>
                  )}

                  {canSelect && (
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect && onToggleSelect(voter.id)}
                        aria-label={`Select ${voter.name_en}`}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                      />
                    </td>
                  )}

                  <td>
                    <strong style={{ color: 'var(--secondary)' }}>#{voter.serial_number}</strong>
                  </td>

                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, color: 'var(--secondary)', fontSize: '0.925rem' }}>
                        {voter.name_en}
                      </span>
                      <span style={{ color: 'var(--primary)', fontWeight: 500, fontSize: '0.85rem' }}>
                        {voter.name_te}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.825rem' }}>
                      <span>{voter.relative_name_en} <span style={{ color: 'var(--text-muted)' }}>({voter.relative_type})</span></span>
                      <span style={{ color: 'var(--text-muted)' }}>{voter.relative_name_te}</span>
                    </div>
                  </td>

                  <td>
                    <span style={{ fontWeight: 600 }}>{voter.house_number_en || '—'}</span>
                  </td>

                  <td>
                    <span style={{ fontSize: '0.85rem' }}>
                      {voter.age} Yrs • <strong>{voter.gender}</strong>
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>Part {voter.part_number || voter.part_id}</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {i18n.language === 'te' ? voter.part_name_te : voter.part_name_en}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span className={`badge ${statusBadge}`}>
                        <StatusIcon size={12} />
                        {t(`directory.${voter.review_status}`, voter.review_status)}
                      </span>
                      {voter.admin_tag && voter.admin_tag !== 'General' && (
                        <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                          {voter.admin_tag}
                        </span>
                      )}
                    </div>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onViewDetails && onViewDetails(voter)}
                      title={t('directory.view_details')}
                    >
                      <Eye size={15} />
                      <span className="hide-mobile">{t('directory.view_details')}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
