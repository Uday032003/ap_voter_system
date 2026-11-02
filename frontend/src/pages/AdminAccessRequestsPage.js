import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js';
import { 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Clock, 
  ShieldAlert,
  Search,
  Check,
  X
} from 'lucide-react';
import { AccessRequestsSkeleton } from '../components/common/SkeletonLoader.js';

export default function AdminAccessRequestsPage() {
  const { t, i18n } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Review modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState(null); // 'approve' | 'reject' | 'revoke'
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [filterStatus, setFilterStatus] = useState('all');

  const isTelugu = i18n.language === 'te';

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAccessRequests();
      if (res.success) {
        setRequests(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load access requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openReviewModal = (req, action) => {
    setSelectedRequest(req);
    setReviewAction(action);
    setReviewNotes('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !reviewAction) return;

    try {
      setSubmitting(true);
      setError(null);

      if (reviewAction === 'approve') {
        await api.approveAccessRequest(selectedRequest.id, reviewNotes);
        setSuccessMsg('Access request approved. Leader constituency permissions activated.');
      } else if (reviewAction === 'reject') {
        await api.rejectAccessRequest(selectedRequest.id, reviewNotes);
        setSuccessMsg('Access request rejected.');
      } else if (reviewAction === 'revoke') {
        await api.revokeAccess(selectedRequest.leader_id, selectedRequest.mptc_village_constituency_id);
        setSuccessMsg('Leader constituency access revoked.');
      }

      setSelectedRequest(null);
      setReviewAction(null);
      await fetchRequests();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="admin-access-requests-page" style={{ paddingBottom: '3.5rem' }}>
      <div className="page-header-container">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-danger page-badge">SUPER ADMIN ACCESS CONTROL</span>
          </div>
          <h1 className="page-title">
            {isTelugu ? 'నాయకుల నియోజకవర్గ అనుమతుల సమీక్ష' : 'Leader Access Requests'}
          </h1>
          <p className="page-subtitle">
            {isTelugu
              ? 'నియోజకవర్గ నాయకుల అభ్యర్థనలను పరిశీలించి ఆమోదించండి, తిరస్కరించండి లేదా ఇప్పటికే ఉన్న అనుమతిని రద్దు చేయండి.'
              : 'Review, approve, reject, or revoke Leader constituency permissions.'}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchRequests}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>{isTelugu ? 'తాజాకరించు' : 'Refresh'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {['all', 'pending', 'approved', 'rejected', 'revoked'].map((status) => (
          <button
            key={status}
            type="button"
            className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatus(status)}
            style={{ textTransform: 'capitalize' }}
          >
            {status} ({requests.filter(r => status === 'all' || r.status === status).length})
          </button>
        ))}
      </div>

      {/* Requests Table Card */}
      <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        {loading ? (
          <AccessRequestsSkeleton rows={5} />
        ) : filteredRequests.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <UserCheck size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p style={{ margin: 0 }}>No access requests matching selected filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem' }}>{isTelugu ? 'తేదీ' : 'Date'}</th>
                  <th style={{ padding: '0.65rem' }}>{isTelugu ? 'నాయకుడు' : 'Leader'}</th>
                  <th style={{ padding: '0.65rem' }}>{isTelugu ? 'కోరిన నియోజకవర్గం' : 'Requested Area'}</th>
                  <th style={{ padding: '0.65rem' }}>{isTelugu ? 'వివరణ' : 'Justification'}</th>
                  <th style={{ padding: '0.65rem' }}>{isTelugu ? 'స్థితి' : 'Status'}</th>
                  <th style={{ padding: '0.65rem', textAlign: 'right' }}>{isTelugu ? 'చర్య' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.65rem', color: '#64748b' }}>
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.65rem' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{req.leader_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.leader_email}</div>
                    </td>
                    <td style={{ padding: '0.65rem' }}>
                      <div style={{ fontWeight: 600 }}>
                        {isTelugu && req.constituency_name_te ? req.constituency_name_te : req.constituency_name_en}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {req.assembly_name_en} • {req.district_name_en}
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem', maxWidth: '240px', color: '#475569', fontSize: '0.84rem' }}>
                      {req.justification}
                    </td>
                    <td style={{ padding: '0.65rem' }}>
                      <span className={`badge ${
                        req.status === 'approved' ? 'badge-primary' :
                        req.status === 'pending' ? 'badge-accent' :
                        req.status === 'rejected' ? 'badge-danger' : 'badge-secondary'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem', textAlign: 'right' }}>
                      {req.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => openReviewModal(req, 'approve')}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#16a34a', borderColor: '#16a34a' }}
                          >
                            <Check size={12} />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openReviewModal(req, 'reject')}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: '#dc2626' }}
                          >
                            <X size={12} />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : req.status === 'approved' ? (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openReviewModal(req, 'revoke')}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: '#dc2626' }}
                        >
                          Revoke Access
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && reviewAction && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{
            maxWidth: '460px',
            width: '100%',
            padding: '1.5rem',
            borderRadius: '16px',
            background: '#ffffff',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
              {reviewAction === 'approve' ? 'Approve Access Request' :
               reviewAction === 'reject' ? 'Reject Access Request' : 'Revoke Leader Access'}
            </h3>

            <div style={{
              padding: '0.75rem',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              marginBottom: '1rem',
              fontSize: '0.85rem'
            }}>
              <div><strong>Leader:</strong> {selectedRequest.leader_name} ({selectedRequest.leader_email})</div>
              <div><strong>Constituency:</strong> {selectedRequest.constituency_name_en}</div>
            </div>

            <form onSubmit={handleReviewSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Review Notes / Comments
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Optional review reason or instructions..."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setSelectedRequest(null); setReviewAction(null); }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${reviewAction === 'approve' ? 'btn-primary' : 'btn-danger'}`}
                  disabled={submitting}
                  style={{ minWidth: '120px' }}
                >
                  {submitting ? 'Processing...' : `Confirm ${reviewAction.toUpperCase()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
