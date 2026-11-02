import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js';
import { 
  CheckCircle2, 
  Search, 
  Trash2, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Users,
  AlertCircle
} from 'lucide-react';
import { VoterTableSkeleton } from '../components/common/SkeletonLoader.js';

export default function LeaderAddedVotersPage() {
  const { t, i18n } = useTranslation();

  const [voters, setVoters] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [removingId, setRemovingId] = useState(null);

  const isTelugu = i18n.language === 'te';

  const fetchAddedVoters = async (targetPage = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: targetPage,
        limit: 25
      };
      if (search.trim()) params.search = search.trim();
      if (gender) params.gender = gender;

      const res = await api.getAddedVoters(params);
      if (res.success) {
        setVoters(res.records || []);
        setTotalCount(res.totalCount || 0);
        setPage(res.page || 1);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch added voters list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddedVoters(1);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAddedVoters(1);
  };

  const handleRemove = async (voterId) => {
    try {
      setRemovingId(voterId);
      setError(null);
      await api.removeVoterFromList(voterId);
      setSuccessMsg('Voter removed from your administrative list.');
      await fetchAddedVoters(page);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to remove voter.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="leader-added-voters-page" style={{ paddingBottom: '3.5rem' }}>
      <div className="page-header-container">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-accent page-badge">ADMINISTRATIVE LIST</span>
          </div>
          <h1 className="page-title">
            {isTelugu ? 'నా జాబితాలోని ఓటర్లు' : 'My Added Voters List'}
          </h1>
          <p className="page-subtitle">
            {isTelugu
              ? 'డైరెక్టరీలో మీరు టిక్ వేసి ఎంచుకున్న ఓటర్ల ప్రత్యక్ష డేటాబేస్ రికార్డులు.'
              : 'Directly tracks voters added through the directory tick button. Persisted in database.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fetchAddedVoters(page)}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>{isTelugu ? 'తాజాకరించు' : 'Refresh'}</span>
          </button>

          <Link to="/leader/voters" className="btn btn-primary btn-sm">
            <span>{isTelugu ? '+ ఓటర్లను చేర్చండి' : '+ Add More Voters'}</span>
          </Link>
        </div>
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

      {/* Search Toolbar */}
      <div className="card" style={{ padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder={isTelugu ? 'జాబితాలో శోధించండి (పేరు, ఓటరు ఐడి, డోర్ నం.)...' : 'Search added list by name, Voter ID, house no...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>

          <div style={{ width: '130px' }}>
            <select className="form-control" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">{isTelugu ? 'లింగం (అన్నీ)' : 'All Genders'}</option>
              <option value="M">Male (M)</option>
              <option value="F">Female (F)</option>
              <option value="O">Other (O)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.25rem' }}>
            {isTelugu ? 'శోధించండి' : 'Search'}
          </button>

          {(search || gender) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearch('');
                setGender('');
                fetchAddedVoters(1);
              }}
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
            {isTelugu ? 'మొత్తం చేర్చబడిన ఓటర్లు:' : 'Total Tracked Voters:'}{' '}
            <span style={{ color: '#15803d', fontWeight: 800 }}>{totalCount.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Page {page} of {totalPages}
          </div>
        </div>

        {loading ? (
          <VoterTableSkeleton rows={8} isLeader={true} />
        ) : voters.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
            <CheckCircle2 size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <h4 style={{ margin: '0 0 0.25rem', color: '#475569' }}>
              {isTelugu ? 'మీ జాబితాలో ఇంకా ఓటర్లు లేరు' : 'Your list is empty'}
            </h4>
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem' }}>
              {isTelugu
                ? 'ఓటరు డైరెక్టరీకి వెళ్లి టిక్ (✓) బటన్‌ను నొక్కడం ద్వారా ఓటర్లను చేర్చవచ్చు.'
                : 'Browse the voter directory and click the tick button next to any voter to add them.'}
            </p>
            <Link to="/leader/voters" className="btn btn-primary btn-sm">
              {isTelugu ? 'ఓటరు డైరెక్టరీకి వెళ్లండి' : 'Go to Voter Directory'}
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                  <th style={{ padding: '0.75rem' }}>{isTelugu ? 'సీరియల్' : 'Sl. No'}</th>
                  <th style={{ padding: '0.75rem' }}>{isTelugu ? 'ఓటరు పేరు' : 'Voter Name'}</th>
                  <th style={{ padding: '0.75rem' }}>{isTelugu ? 'బంధువు పేరు' : 'Relative Name'}</th>
                  <th style={{ padding: '0.75rem' }}>{isTelugu ? 'ఓటరు ఐడి' : 'EPIC'}</th>
                  <th style={{ padding: '0.75rem' }}>{isTelugu ? 'డోర్ నం.' : 'House No.'}</th>
                  <th style={{ padding: '0.75rem' }}>{isTelugu ? 'వయస్సు / లింగం' : 'Age/Sex'}</th>
                  <th style={{ padding: '0.75rem' }}>{isTelugu ? 'పార్ట్ నం.' : 'Part'}</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>{isTelugu ? 'చర్య' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {voters.map((voter) => (
                  <tr key={voter.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 700, color: '#4f46e5' }}>
                      #{voter.serial_number}
                    </td>

                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {isTelugu && voter.name_te ? voter.name_te : voter.name_en}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        {voter.name_en} {voter.name_te && voter.name_en !== voter.name_te ? `• ${voter.name_te}` : ''}
                      </div>
                    </td>

                    <td style={{ padding: '0.75rem', color: '#475569' }}>
                      <div>{isTelugu && voter.relative_name_te ? voter.relative_name_te : voter.relative_name_en || '—'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{voter.relative_type || 'Father'}</div>
                    </td>

                    <td style={{ padding: '0.75rem', fontWeight: 600, color: '#0284c7' }}>
                      {voter.voter_id || '—'}
                    </td>

                    <td style={{ padding: '0.75rem', color: '#475569' }}>
                      {voter.house_number || '—'}
                    </td>

                    <td style={{ padding: '0.75rem', color: '#475569' }}>
                      {voter.age || '—'} / {voter.gender || '—'}
                    </td>

                    <td style={{ padding: '0.75rem', color: '#64748b' }}>
                      Part {voter.part_number}
                    </td>

                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <Link
                          to={`/leader/voters/${voter.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
                        >
                          <Eye size={13} />
                        </Link>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleRemove(voter.id)}
                          disabled={removingId === voter.id}
                          title="Remove from my list"
                          style={{ padding: '0.25rem 0.5rem', color: '#dc2626' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid #f1f5f9'
          }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page <= 1 || loading}
              onClick={() => fetchAddedVoters(page - 1)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages || loading}
              onClick={() => fetchAddedVoters(page + 1)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
