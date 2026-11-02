import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { ShieldCheck, Check, X, Clock, UserCheck, AlertCircle } from 'lucide-react';
import SkeletonLoader from '../common/SkeletonLoader.js';

export default function AccessRequestsManager() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.getAccessRequests();
      if (res.success) {
        setRequests(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load access requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      const res = await api.approveAccessRequest(id, 'Approved via Super Admin Console');
      if (res.success) {
        showToast(res.message, 'success');
        await loadRequests();
      }
    } catch (err) {
      showToast(err.message || 'Approval failed', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Enter rejection reason (optional):');
    if (reason === null) return; // user cancelled prompt

    setProcessingId(id);
    try {
      const res = await api.rejectAccessRequest(id, reason || 'Rejected by administrator');
      if (res.success) {
        showToast('Request rejected', 'info');
        await loadRequests();
      }
    } catch (err) {
      showToast(err.message || 'Rejection failed', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--secondary)' }}>{t('admin.requests_title')}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Review applicants requesting Leader administrative permissions for specific MPTC constituencies
          </p>
        </div>
      </div>

      {loading ? (
        <SkeletonLoader rows={3} height="3.5rem" />
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <UserCheck size={36} color="#94a3b8" style={{ margin: '0 auto 0.5rem' }} />
          <p>No access requests submitted.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>{t('admin.user')}</th>
                <th>District & Mandal</th>
                <th>{t('admin.constituency')}</th>
                <th>{t('admin.justification')}</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => {
                const isPending = req.status === 'pending';
                const isProcessing = processingId === req.id;

                return (
                  <tr key={req.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>
                          {req.user?.full_name_en || 'User'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {req.user?.email}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>
                        {req.district_name_en} / {req.mandal_name_en}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-primary">
                        {req.constituency_name_en}
                      </span>
                    </td>
                    <td style={{ maxWidth: '280px', fontSize: '0.825rem', color: '#475569' }}>
                      {req.justification}
                    </td>
                    <td>
                      <span className={`badge ${
                        req.status === 'approved' ? 'badge-success' :
                        req.status === 'rejected' ? 'badge-danger' :
                        'badge-warning'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isPending ? (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleApprove(req.id)}
                            disabled={isProcessing}
                          >
                            <Check size={14} />
                            {t('admin.approve')}
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => handleReject(req.id)}
                            disabled={isProcessing}
                          >
                            <X size={14} />
                            {t('admin.reject')}
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Reviewed by {req.reviewer_name || 'Admin'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
