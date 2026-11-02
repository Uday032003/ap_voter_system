import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckSquare, X, CheckCircle, AlertCircle, Tag, Download } from 'lucide-react';
import ConfirmModal from '../common/ConfirmModal.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';

export default function BulkActionToolbar({
  selectedIds,
  constituencyId,
  onClearSelection,
  onActionComplete
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [activeAction, setActiveAction] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [showTagModal, setShowTagModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!selectedIds || selectedIds.length === 0) return null;

  const handleActionClick = (action) => {
    setActiveAction(action);
    if (action === 'assign_tag') {
      setShowTagModal(true);
    } else {
      setShowConfirmModal(true);
    }
  };

  const executeBulkAction = async (actionToRun, tagValue = null) => {
    setProcessing(true);
    try {
      const payload = {
        constituency_id: constituencyId,
        voter_ids: selectedIds,
        action: actionToRun,
        tag_value: tagValue
      };

      const res = await api.bulkVoterAction(payload);
      if (res.success) {
        if (actionToRun === 'export_minimized' && res.data) {
          // Download as CSV file in browser
          const headers = Object.keys(res.data[0] || {}).join(',');
          const csvRows = res.data.map(row => 
            Object.values(row).map(val => `"${val !== undefined && val !== null ? val : ''}"`).join(',')
          );
          const csvString = [headers, ...csvRows].join('\n');
          const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `authorized_voters_export_${Date.now()}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          showToast(`Exported ${res.exportedCount} records to CSV`, 'success');
        } else {
          showToast(t('bulk.success_message', { count: res.successCount }), 'success');
          if (res.failedCount > 0) {
            showToast(t('bulk.failure_message', { count: res.failedCount }), 'warning');
          }
        }

        if (onActionComplete) onActionComplete(actionToRun);
        onClearSelection();
      }
    } catch (err) {
      showToast(err.message || 'Bulk operation failed', 'error');
    } finally {
      setProcessing(false);
      setShowConfirmModal(false);
      setShowTagModal(false);
    }
  };

  return (
    <>
      <div className="bulk-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <CheckSquare size={18} color="#10b981" />
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            {selectedIds.length} {t('bulk.bar_title')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-sm"
            style={{ background: '#059669', color: '#fff', border: 'none' }}
            onClick={() => handleActionClick('mark_reviewed')}
            disabled={processing}
          >
            <CheckCircle size={15} />
            {t('bulk.mark_reviewed')}
          </button>

          <button
            type="button"
            className="btn btn-sm"
            style={{ background: '#d97706', color: '#fff', border: 'none' }}
            onClick={() => handleActionClick('mark_needs_review')}
            disabled={processing}
          >
            <AlertCircle size={15} />
            {t('bulk.mark_needs_review')}
          </button>

          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => handleActionClick('assign_tag')}
            disabled={processing}
          >
            <Tag size={15} />
            {t('bulk.assign_tag')}
          </button>

          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => handleActionClick('export_minimized')}
            disabled={processing}
          >
            <Download size={15} />
            {t('bulk.export_minimized')}
          </button>
        </div>

        <button
          type="button"
          onClick={onClearSelection}
          className="btn btn-sm btn-secondary"
          style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: 'none' }}
          title={t('directory.clear_selection')}
        >
          <X size={16} />
        </button>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title={t('bulk.confirm_title')}
        message={t('bulk.confirm_message', { count: selectedIds.length })}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => executeBulkAction(activeAction)}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* Assign Tag Modal */}
      {showTagModal && (
        <div className="modal-overlay" onClick={() => setShowTagModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem' }}>{t('bulk.assign_tag')}</h3>
              <button
                type="button"
                onClick={() => setShowTagModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Enter Administrative Tag Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Senior Citizen, PWD, Verified Resident"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowTagModal(false)}>
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => executeBulkAction('assign_tag', tagInput)}
                disabled={!tagInput.trim()}
              >
                Apply Tag to {selectedIds.length} Records
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
