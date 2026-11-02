import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js';
import { 
  Users, 
  ArrowLeft, 
  Edit2, 
  CheckCircle2, 
  X, 
  MapPin, 
  Calendar, 
  Home, 
  ShieldCheck, 
  FileText
} from 'lucide-react';
import { VoterDetailSkeleton } from '../components/common/SkeletonLoader.js';

export default function AdminVoterDetailPage() {
  const { voterId } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [voter, setVoter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const isTelugu = i18n.language === 'te';

  const fetchVoter = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getVoter(voterId);
      if (res.success && res.data) {
        setVoter(res.data);
        setFormData({
          name_en: res.data.name_en || '',
          name_te: res.data.name_te || '',
          relative_type: res.data.relative_type || 'Father',
          relative_name_en: res.data.relative_name_en || '',
          relative_name_te: res.data.relative_name_te || '',
          voter_id: res.data.voter_id || '',
          house_number: res.data.house_number || '',
          age: res.data.age || '',
          gender: res.data.gender || 'M',
          part_number: res.data.part_number || '1',
          serial_number: res.data.serial_number || ''
        });
      } else {
        setError('Voter record not found.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load voter details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoter();
  }, [voterId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const updates = {
        name_en: formData.name_en,
        name_te: formData.name_te,
        relative_type: formData.relative_type,
        relative_name_en: formData.relative_name_en,
        relative_name_te: formData.relative_name_te,
        voter_id: formData.voter_id,
        house_number: formData.house_number,
        age: Number(formData.age) || undefined,
        gender: formData.gender,
        part_number: String(formData.part_number),
        serial_number: Number(formData.serial_number) || undefined
      };

      const res = await api.updateVoter(voterId, updates);
      if (res.success) {
        setSuccessMsg('Voter record updated successfully.');
        setIsEditing(false);
        await fetchVoter();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update voter record.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
        <VoterDetailSkeleton />
      </div>
    );
  }

  if (!voter) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p>{error || 'Voter record not found.'}</p>
        <Link to="/admin/voters" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-voter-detail-page" style={{ paddingBottom: '3.5rem', maxWidth: '800px', margin: '0 auto' }}>
      {/* Back button */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/admin/voters" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#4f46e5', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
          <ArrowLeft size={16} />
          <span>{isTelugu ? 'ఓటరు జాబితాకు తిరిగి వెళ్లండి' : 'Back to All Voters'}</span>
        </Link>
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

      {/* Main Voter Record Card */}
      <div className="card" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-primary page-badge">SERIAL #{voter.serial_number}</span>
              <span className="badge badge-secondary page-badge">PART {voter.part_number}</span>
              {voter.voter_id && (
                <span className="badge badge-accent page-badge">EPIC: {voter.voter_id}</span>
              )}
            </div>
            <h1 className="page-title">
              {isTelugu && voter.name_te ? voter.name_te : voter.name_en}
            </h1>
            <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.25rem' }}>
              {voter.name_en} {voter.name_te && voter.name_en !== voter.name_te ? `• ${voter.name_te}` : ''}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsEditing(!isEditing)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Edit2 size={15} />
            <span>{isEditing ? (isTelugu ? 'రద్దు చేయి' : 'Cancel Edit') : (isTelugu ? 'సవరించండి' : 'Edit Voter')}</span>
          </button>
        </div>

        {isEditing ? (
          /* Edit Form */
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  English Name *
                </label>
                <input
                  type="text"
                  name="name_en"
                  className="form-control"
                  value={formData.name_en}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Telugu Name (తెలుగు పేరు)
                </label>
                <input
                  type="text"
                  name="name_te"
                  className="form-control"
                  value={formData.name_te}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Relative Relation
                </label>
                <select
                  name="relative_type"
                  className="form-control"
                  value={formData.relative_type}
                  onChange={handleInputChange}
                >
                  <option value="Father">Father (తండ్రి)</option>
                  <option value="Husband">Husband (భర్త)</option>
                  <option value="Mother">Mother (తల్లి)</option>
                  <option value="Other">Other (ఇతర)</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Relative Name (English)
                </label>
                <input
                  type="text"
                  name="relative_name_en"
                  className="form-control"
                  value={formData.relative_name_en}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Relative Name (Telugu)
                </label>
                <input
                  type="text"
                  name="relative_name_te"
                  className="form-control"
                  value={formData.relative_name_te}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Voter ID (EPIC Number)
                </label>
                <input
                  type="text"
                  name="voter_id"
                  className="form-control"
                  value={formData.voter_id}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  House / Door Number
                </label>
                <input
                  type="text"
                  name="house_number"
                  className="form-control"
                  value={formData.house_number}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  className="form-control"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="18"
                  max="130"
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Gender
                </label>
                <select
                  name="gender"
                  className="form-control"
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value="M">Male (M)</option>
                  <option value="F">Female (F)</option>
                  <option value="O">Other (O)</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Part Number
                </label>
                <input
                  type="text"
                  name="part_number"
                  className="form-control"
                  value={formData.part_number}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Serial Number
                </label>
                <input
                  type="number"
                  name="serial_number"
                  className="form-control"
                  value={formData.serial_number}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ minWidth: '140px' }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          /* View Mode */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                {isTelugu ? 'బంధువు వివరాలు' : 'Relative Details'}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginTop: '0.2rem' }}>
                {isTelugu && voter.relative_name_te ? voter.relative_name_te : voter.relative_name_en || '—'}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                {voter.relative_type || 'Father'} {voter.relative_name_te && voter.relative_name_en ? `(${voter.relative_name_en})` : ''}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                {isTelugu ? 'ఇంటి నంబరు' : 'House / Door Number'}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginTop: '0.2rem' }}>
                {voter.house_number || '—'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                {isTelugu ? 'వయస్సు / లింగం' : 'Age & Gender'}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginTop: '0.2rem' }}>
                {voter.age || '—'} years • {voter.gender === 'M' ? 'Male (పురుషుడు)' : voter.gender === 'F' ? 'Female (మహిళ)' : voter.gender}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                {isTelugu ? 'ఎం.పి.టి.సి నియోజకవర్గం' : 'MPTC Constituency'}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginTop: '0.2rem' }}>
                {isTelugu && voter.constituency_name_te ? voter.constituency_name_te : voter.constituency_name_en || 'Atmakuru MPTC'}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                {voter.assembly_name_en} • {voter.district_name_en}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                {isTelugu ? 'ఓటరు గుర్తింపు సంఖ్య' : 'EPIC Number'}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0284c7', marginTop: '0.2rem' }}>
                {voter.voter_id || 'Not Assigned'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                {isTelugu ? 'రోల్ పార్ట్ & సీరియల్' : 'Roll Part & Serial'}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginTop: '0.2rem' }}>
                Part #{voter.part_number} • Serial #{voter.serial_number}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
