import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import ConstituencySelector from '../components/constituency/ConstituencySelector.js';
import { VoterTableSkeleton } from '../components/common/SkeletonLoader.js';
import { 
  Users, 
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export default function CommonerVotersPage() {
  const { t, i18n } = useTranslation();
  const { user, selectedConstituency } = useAuth();

  const [voters, setVoters] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [partNumber, setPartNumber] = useState('');

  const isTelugu = i18n.language === 'te';

  const fetchVoters = async (targetPage = 1, constituencyId = selectedConstituency?.id) => {
    if (!constituencyId) return;

    try {
      setLoading(true);
      setError(null);

      const params = {
        constituencyId,
        page: targetPage,
        limit: 25
      };
      if (search.trim()) params.search = search.trim();
      if (gender) params.gender = gender;
      if (partNumber.trim()) params.partNumber = partNumber.trim();

      const res = await api.getVoters(params);
      if (res.success) {
        setVoters(res.records || []);
        setTotalCount(res.totalCount || 0);
        setPage(res.page || 1);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      setError(err.message || 'Failed to load public electoral roll.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedConstituency?.id) {
      fetchVoters(1, selectedConstituency.id);
    }
  }, [selectedConstituency]);

  const handleConstituencyConfirmed = (mptcId) => {
    fetchVoters(1, mptcId);
  };

  return (
    <div className="commoner-voters-page" style={{ paddingBottom: '3.5rem' }}>
      <div className="page-header-container">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-primary page-badge">PUBLIC ELECTORAL ROLL</span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Citizen Verification Portal</span>
          </div>
          <h1 className="page-title">
            {isTelugu ? 'పౌర ఓటరు డైరెక్టరీ' : 'Public Voter Directory'}
          </h1>
          <p className="page-subtitle">
            {isTelugu
              ? 'మీ నియోజకవర్గాన్ని ఎంచుకుని, ఓటరు జాబితాలో మీ పేరు మరియు వివరాలను సరిచూసుకోండి.'
              : 'Search and verify your voter registration within your designated Andhra Pradesh constituency.'}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => fetchVoters(page)}
          disabled={loading || !selectedConstituency}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>{isTelugu ? 'తాజాకరించు' : 'Refresh'}</span>
        </button>
      </div>

      {/* Constituency Selector with Persistence and Edit Selection */}
      <ConstituencySelector onSelectionConfirmed={handleConstituencyConfirmed} />

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
          {error}
        </div>
      )}

      {selectedConstituency && (
        <>
          {/* Search Bar */}
          <div className="card" style={{ padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <form onSubmit={(e) => { e.preventDefault(); fetchVoters(1); }} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 240px', position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder={isTelugu ? 'పేరు, ఓటరు ఐడి, డోర్ నంబర్...' : 'Search your name (Telugu/English), Voter ID, house number...'}
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

              <div style={{ width: '120px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder={isTelugu ? 'పార్ట్ నం.' : 'Part No.'}
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.25rem' }}>
                {isTelugu ? 'శోధించండి' : 'Search'}
              </button>

              {(search || gender || partNumber) && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearch('');
                    setGender('');
                    setPartNumber('');
                    fetchVoters(1);
                  }}
                >
                  Reset
                </button>
              )}
            </form>
          </div>

          {/* Roll Records */}
          <div className="card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
                {isTelugu ? 'రిజిస్టర్ అయిన ఓటర్లు:' : 'Registered Voters Found:'}{' '}
                <span style={{ color: '#0f172a', fontWeight: 800 }}>{totalCount.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Page {page} of {totalPages}
              </div>
            </div>

            {loading ? (
              <VoterTableSkeleton rows={8} />
            ) : voters.length === 0 ? (
              <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                <Users size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                <h4 style={{ margin: '0 0 0.25rem', color: '#475569' }}>
                  {isTelugu ? 'ఓటరు రికార్డులు కనిపించలేదు' : 'No matching voter records found'}
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  {isTelugu ? 'శోధన పదాన్ని సరిచూసుకోండి లేదా నియోజకవర్గాన్ని మార్చండి.' : 'Verify the spelling or check another part number.'}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                      <th style={{ padding: '0.75rem' }}>{isTelugu ? 'క్రమ సంఖ్య' : 'Sl. No'}</th>
                      <th style={{ padding: '0.75rem' }}>{isTelugu ? 'ఓటరు పేరు (తెలుగు & English)' : 'Voter Name'}</th>
                      <th style={{ padding: '0.75rem' }}>{isTelugu ? 'బంధువు పేరు' : 'Relative Name'}</th>
                      <th style={{ padding: '0.75rem' }}>{isTelugu ? 'ఓటరు ఐడి' : 'Voter ID (EPIC)'}</th>
                      <th style={{ padding: '0.75rem' }}>{isTelugu ? 'డోర్ నం.' : 'House No.'}</th>
                      <th style={{ padding: '0.75rem' }}>{isTelugu ? 'వయస్సు / లింగం' : 'Age/Sex'}</th>
                      <th style={{ padding: '0.75rem' }}>{isTelugu ? 'పార్ట్ నం.' : 'Part'}</th>
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
                  onClick={() => fetchVoters(page - 1)}
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
                  onClick={() => fetchVoters(page + 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
