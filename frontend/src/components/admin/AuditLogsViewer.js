import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Shield, Clock, Search } from 'lucide-react';
import SkeletonLoader from '../common/SkeletonLoader.js';

export default function AuditLogsViewer() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchAction, setSearchAction] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs({ action: searchAction });
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [searchAction]);

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--secondary)' }}>System Audit Trail</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Immutable administrative event logging, user sessions, and bulk updates
          </p>
        </div>

        <div style={{ position: 'relative', width: '240px' }}>
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2rem', fontSize: '0.8rem' }}
            placeholder="Filter by action..."
            value={searchAction}
            onChange={e => setSearchAction(e.target.value)}
          />
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </div>

      {loading ? (
        <SkeletonLoader rows={4} height="3rem" />
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <Shield size={36} color="#94a3b8" style={{ margin: '0 auto 0.5rem' }} />
          <p>No audit logs matching query.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Entity</th>
                <th>User / Identity</th>
                <th>Details</th>
                <th>IP Address</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>
                    <span className="badge badge-secondary" style={{ fontFamily: 'monospace' }}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{log.entity_type}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>
                      <strong>{log.user_name}</strong>
                      <div style={{ color: 'var(--text-muted)' }}>{log.user_email}</div>
                    </div>
                  </td>
                  <td style={{ maxWidth: '320px', fontSize: '0.75rem', fontFamily: 'monospace', color: '#475569' }}>
                    {log.details ? JSON.stringify(log.details) : '-'}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {log.ip_address || '127.0.0.1'}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
