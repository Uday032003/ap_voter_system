import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { UserPlus, Send, CheckCircle2, Clock } from 'lucide-react';

export default function RequestAccessPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [constituencies, setConstituencies] = useState([]);

  const [selectedDistrict, setSelectedDistrict] = useState('d1111111-0000-0000-0000-000000000001');
  const [selectedMandal, setSelectedMandal] = useState('m1111111-0000-0000-0000-000000000001');
  const [selectedConstituency, setSelectedConstituency] = useState('c1111111-0000-0000-0000-000000000001');
  const [justification, setJustification] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState([]);

  const loadData = async () => {
    try {
      const [dRes, mRes, cRes, rRes] = await Promise.all([
        api.getDistricts(),
        api.getMandals(),
        api.getConstituencies(),
        api.getAccessRequests()
      ]);

      if (dRes.success) setDistricts(dRes.data);
      if (mRes.success) setMandals(mRes.data);
      if (cRes.success) setConstituencies(cRes.data);
      if (rRes.success) setMyRequests(rRes.data);
    } catch (err) {
      console.error('Failed to load access request data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!justification.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.submitAccessRequest({
        district_id: selectedDistrict,
        mandal_id: selectedMandal,
        constituency_id: selectedConstituency,
        justification
      });

      if (res.success) {
        showToast(res.message, 'success');
        setJustification('');
        await loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '1.5rem auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UserPlus size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--secondary)' }}>{t('nav.request_access')}</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Apply for administrative Leader permissions to manage specific MPTC constituencies
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Select District</label>
            <select
              className="form-control"
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
            >
              {districts.map(d => (
                <option key={d.id} value={d.id}>
                  {i18n.language === 'te' ? d.name_te : d.name_en} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Select Mandal</label>
            <select
              className="form-control"
              value={selectedMandal}
              onChange={e => setSelectedMandal(e.target.value)}
            >
              {mandals.map(m => (
                <option key={m.id} value={m.id}>
                  {i18n.language === 'te' ? m.name_te : m.name_en}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Select MPTC Constituency</label>
            <select
              className="form-control"
              value={selectedConstituency}
              onChange={e => setSelectedConstituency(e.target.value)}
            >
              {constituencies.map(c => (
                <option key={c.id} value={c.id}>
                  {i18n.language === 'te' ? c.name_te : c.name_en} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Justification & Credentials</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="State your role, designation, and official assignment for this constituency..."
              value={justification}
              onChange={e => setJustification(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '0.75rem', marginTop: '0.5rem' }}
            disabled={submitting || !justification.trim()}
          >
            <Send size={16} />
            {submitting ? 'Submitting Application...' : 'Submit Access Request'}
          </button>
        </form>
      </div>

      {/* Existing Requests Track Box */}
      {myRequests.length > 0 && (
        <div className="card">
          <h4 style={{ fontSize: '0.95rem', color: 'var(--secondary)', marginBottom: '0.85rem' }}>
            My Submitted Access Requests
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {myRequests.map(req => (
              <div
                key={req.id}
                style={{
                  padding: '0.85rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>
                    {req.constituency_name_en}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Submitted on {new Date(req.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span className={`badge ${
                  req.status === 'approved' ? 'badge-success' :
                  req.status === 'rejected' ? 'badge-danger' :
                  'badge-warning'
                }`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
