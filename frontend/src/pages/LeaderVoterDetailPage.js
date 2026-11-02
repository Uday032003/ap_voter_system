import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js';
import { 
  ArrowLeft, 
  Users, 
  Check, 
  Plus, 
  RefreshCw, 
  MapPin, 
  FileText,
  ShieldCheck
} from 'lucide-react';
import { VoterDetailSkeleton } from '../components/common/SkeletonLoader.js';

export default function LeaderVoterDetailPage() {
  const { voterId } = useParams();
  const { t, i18n } = useTranslation();

  const [voter, setVoter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isToggling, setIsToggling] = useState(false);

  const isTelugu = i18n.language === 'te';

  const fetchVoter = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getVoter(voterId);
      if (res.success && res.data) {
        setVoter(res.data);
      } else {
        setError('Voter record not found or access unauthorized.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load voter record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoter();
  }, [voterId]);

  const handleToggleAdd = async () => {
    if (!voter) return;
    const isCurrentlyAdded = Boolean(voter.is_added || voter.is_marked);

    try {
      setIsToggling(true);
      if (isCurrentlyAdded) {
        await api.removeVoterFromList(voter.id);
        setVoter(prev => ({ ...prev, is_added: false, is_marked: false }));
      } else {
        await api.addVoterToList(voter.id);
        setVoter(prev => ({ ...prev, is_added: true, is_marked: true }));
      }
    } catch (err) {
      setError(err.message || 'Failed to update tracking list.');
    } finally {
      setIsToggling(false);
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
        <Link to="/leader/voters" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Directory
        </Link>
      </div>
    );
  }

  const isAdded = Boolean(voter.is_added || voter.is_marked);

  return (
    <div className="leader-voter-detail-page" style={{ paddingBottom: '3.5rem', maxWidth: '780px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/leader/voters" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#4f46e5', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
          <ArrowLeft size={16} />
          <span>{isTelugu ? 'ఓటరు డైరెక్టరీకి తిరిగి వెళ్లండి' : 'Back to Directory'}</span>
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-primary page-badge">SERIAL #{voter.serial_number}</span>
              <span className="badge badge-secondary page-badge">PART {voter.part_number}</span>
              {voter.voter_id && <span className="badge badge-accent page-badge">EPIC: {voter.voter_id}</span>}
            </div>
            <h1 className="page-title">
              {isTelugu && voter.name_te ? voter.name_te : voter.name_en}
            </h1>
            <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.25rem' }}>
              {voter.name_en} {voter.name_te && voter.name_en !== voter.name_te ? `• ${voter.name_te}` : ''}
            </div>
          </div>

          {/* Add to my list tick button */}
          <button
            type="button"
            className={`btn ${isAdded ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handleToggleAdd}
            disabled={isToggling}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
              color: isAdded ? '#16a34a' : '#ffffff',
              borderColor: isAdded ? '#16a34a' : undefined
            }}
          >
            {isToggling ? (
              <RefreshCw size={16} className="spin" />
            ) : isAdded ? (
              <>
                <Check size={16} strokeWidth={3} />
                <span>In My List (Click to Remove)</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Add to My List</span>
              </>
            )}
          </button>
        </div>

        {/* Read-Only Master Record Fields */}
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
              {voter.age || '—'} years • {voter.gender === 'M' ? 'Male' : voter.gender === 'F' ? 'Female' : voter.gender}
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

        <div style={{ marginTop: '2rem', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#64748b' }}>
          🔒 Master voter roll field edits are restricted to authorized Super Administrators only.
        </div>
      </div>
    </div>
  );
}
