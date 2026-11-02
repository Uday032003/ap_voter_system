import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, CheckCircle2, Circle, Eye, MapPin, Home, User, AlertCircle } from 'lucide-react';

export default function VoterCard({
  voter,
  isSelected,
  onToggleSelect,
  onToggleMark,
  onViewDetails,
  canSelect = false,
  canMark = true,
  isLeader = false
}) {
  const { t, i18n } = useTranslation();
  const [markingLoading, setMarkingLoading] = useState(false);

  const handleMarkClick = async (e) => {
    e.stopPropagation();
    if (markingLoading || !onToggleMark) return;
    setMarkingLoading(true);
    try {
      await onToggleMark(voter);
    } finally {
      setMarkingLoading(false);
    }
  };

  const isMarked = Boolean(voter.is_marked);

  return (
    <div 
      className={`voter-mobile-card ${isMarked ? 'voter-card-marked' : ''} ${isSelected ? 'voter-card-selected' : ''}`}
      role="article"
      aria-label={`Voter ${voter.name_en || voter.serial_number}`}
    >
      {/* Top Header: Serial Number, House Number, and Action Buttons */}
      <div className="voter-card-header">
        <div className="voter-card-meta">
          <span className="voter-serial-badge">
            #{voter.serial_number}
          </span>
          {voter.house_number_en && (
            <span className="voter-house-badge" title="House Number">
              <Home size={13} />
              <span>{voter.house_number_en}</span>
            </span>
          )}
          <span className="voter-age-gender-badge">
            {voter.age} Yrs • {voter.gender}
          </span>
        </div>

        <div className="voter-card-actions">
          {/* Administrative Mark Button (Touch-Friendly >= 44x44px) */}
          {canMark && isLeader && (
            <button
              type="button"
              className={`touch-mark-btn ${isMarked ? 'marked' : 'unmarked'}`}
              onClick={handleMarkClick}
              disabled={markingLoading}
              title={isMarked ? t('directory.unmark_action', 'Unmark from Leader Workspace') : t('directory.mark_action', 'Mark for Leader Workspace')}
              aria-label={isMarked ? `Unmark voter #${voter.serial_number}` : `Mark voter #${voter.serial_number}`}
              aria-pressed={isMarked}
            >
              {markingLoading ? (
                <span className="spinner-dots" aria-hidden="true">...</span>
              ) : isMarked ? (
                <>
                  <CheckCircle2 size={22} className="mark-icon-active" />
                  <span className="sr-only">Marked</span>
                </>
              ) : (
                <>
                  <Circle size={22} className="mark-icon-inactive" />
                  <span className="sr-only">Unmarked</span>
                </>
              )}
            </button>
          )}

          {/* Optional Multi-Select Checkbox for Bulk Actions */}
          {canSelect && onToggleSelect && (
            <div className="touch-select-wrapper">
              <input
                type="checkbox"
                className="touch-checkbox"
                checked={Boolean(isSelected)}
                onChange={() => onToggleSelect(voter.id)}
                aria-label={`Select ${voter.name_en} for bulk actions`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Voter Primary Name (English & Telugu) */}
      <div className="voter-card-body" onClick={() => onViewDetails && onViewDetails(voter)}>
        <div className="voter-name-group">
          <h3 className="voter-name-en">
            {voter.name_en}
          </h3>
          {voter.name_te && (
            <h4 className="voter-name-te">
              {voter.name_te}
            </h4>
          )}
        </div>

        {/* Relative Details */}
        {(voter.relative_name_en || voter.relative_name_te) && (
          <div className="voter-relative-info">
            <span className="voter-relative-label">
              {voter.relative_type || 'Relation'}:
            </span>{' '}
            <span className="voter-relative-val">
              {voter.relative_name_en}
              {voter.relative_name_te ? ` • ${voter.relative_name_te}` : ''}
            </span>
          </div>
        )}

        {/* Polling Station / Part Information */}
        <div className="voter-part-info">
          <MapPin size={13} className="voter-icon-muted" />
          <span>
            Part {voter.part_number || voter.part_id}
            {voter.part_name_en ? ` - ${i18n.language === 'te' && voter.part_name_te ? voter.part_name_te : voter.part_name_en}` : ''}
          </span>
        </div>
      </div>

      {/* Card Footer: Status & View Details button */}
      <div className="voter-card-footer">
        <div className="voter-status-badges">
          {isMarked && (
            <span className="badge badge-accent badge-touch" title="Marked in Leader Workspace">
              <Check size={12} />
              {t('directory.marked_badge', 'Marked')}
            </span>
          )}
          {voter.review_status && voter.review_status !== 'approved' && (
            <span className={`badge ${voter.review_status === 'flagged' ? 'badge-danger' : 'badge-warning'} badge-touch`}>
              <AlertCircle size={12} />
              {t(`directory.${voter.review_status}`, voter.review_status)}
            </span>
          )}
          {voter.admin_tag && voter.admin_tag !== 'General' && (
            <span className="badge badge-secondary badge-touch">
              {voter.admin_tag}
            </span>
          )}
        </div>

        {onViewDetails && (
          <button
            type="button"
            className="btn btn-secondary btn-sm voter-details-btn"
            onClick={() => onViewDetails(voter)}
            aria-label={`View details for ${voter.name_en}`}
          >
            <Eye size={15} />
            <span>{t('directory.view_details', 'Details')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
