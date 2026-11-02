import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js';
import ConstituencySelector from '../components/constituency/ConstituencySelector.js';
import { VoterCardsSkeleton } from '../components/common/SkeletonLoader.js';
import { 
  User,
  Users, 
  Home,
  Calendar,
  UserCheck,
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Eye,
  Layers,
  MapPin
} from 'lucide-react';

function getRelativeLabel(relativeType, isTelugu) {
  const norm = (relativeType || '').toLowerCase();
  if (norm.includes('father')) return isTelugu ? 'తండ్రి పేరు' : "Father's Name";
  if (norm.includes('husband')) return isTelugu ? 'భర్త పేరు' : "Husband's Name";
  if (norm.includes('mother')) return isTelugu ? 'తల్లి పేరు' : "Mother's Name";
  if (norm.includes('other')) return isTelugu ? 'సంరక్షకుడి పేరు' : "Guardian's Name";
  return isTelugu ? 'బంధువు పేరు' : (relativeType ? `${relativeType}'s Name` : "Relative's Name");
}

function formatGender(gender, isTelugu) {
  const g = (gender || '').toUpperCase();
  if (g === 'M' || g.startsWith('MALE')) return isTelugu ? 'పురుషుడు (Male)' : 'Male';
  if (g === 'F' || g.startsWith('FEMALE')) return isTelugu ? 'స్త్రీ (Female)' : 'Female';
  return isTelugu ? 'ఇతర (Other)' : 'Other';
}

export default function AdminVotersPage() {
  const { t, i18n } = useTranslation();

  const [voters, setVoters] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [selectedMptcId, setSelectedMptcId] = useState('');

  const isTelugu = i18n.language === 'te';

  const fetchVoters = async (targetPage = 1, mptcId = selectedMptcId) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: targetPage,
        limit: 25
      };
      if (mptcId) params.constituencyId = mptcId;
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
      setError(err.message || 'Failed to fetch voter directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoters(1);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVoters(1);
  };

  const handleConstituencyConfirmed = (mptcId) => {
    setSelectedMptcId(mptcId);
    fetchVoters(1, mptcId);
  };

  return (
    <div className="admin-voters-page" style={{ paddingBottom: '3.5rem' }}>
      <div className="page-header-container">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-danger page-badge">SUPER ADMIN MASTER ROLL</span>
          </div>
          <h1 className="page-title">
            {isTelugu ? 'అధికారిక ఓటరు డైరెక్టరీ' : 'All Voters Directory'}
          </h1>
          <p className="page-subtitle">
            {isTelugu
              ? 'ఆంధ్రప్రదేశ్ రాష్ట్ర ఎన్నికల రికార్డుల పూర్తి శోధన మరియు సవరణ జాబితా.'
              : 'Master electoral roll directory with bilingual script preservation and authorized record edits.'}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => fetchVoters(page)}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>{isTelugu ? 'తాజాకరించు' : 'Refresh'}</span>
        </button>
      </div>

      {/* Constituency Selector Banner */}
      <ConstituencySelector onSelectionConfirmed={handleConstituencyConfirmed} />

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
          {error}
        </div>
      )}

      {/* Search and Filters Toolbar */}
      <div className="card" style={{ padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder={isTelugu ? 'పేరు, ఓటరు ఐడి, డోర్ నంబర్ లేదా సీరియల్ నంబర్...' : 'Search name (EN/TE), Voter ID, house number, or serial...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>

          <div style={{ width: '130px' }}>
            <select className="form-control" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">{isTelugu ? 'లింగం (అన్నీ)' : 'All Genders'}</option>
              <option value="M">{isTelugu ? 'పురుషులు (M)' : 'Male (M)'}</option>
              <option value="F">{isTelugu ? 'మహిళలు (F)' : 'Female (F)'}</option>
              <option value="O">{isTelugu ? 'ఇతరులు (O)' : 'Other (O)'}</option>
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
                fetchVoters(1, selectedMptcId);
              }}
            >
              {isTelugu ? 'రీసెట్' : 'Reset'}
            </button>
          )}
        </form>
      </div>

      {/* Results Count & Directory Cards */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem', padding: '0 0.25rem' }}>
        <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
          {isTelugu ? 'మొత్తం ఓటరు రికార్డులు:' : 'Total Voters Found:'}{' '}
          <span style={{ color: '#0f172a', fontWeight: 800 }}>{totalCount.toLocaleString()}</span>
        </div>
        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
          Page {page} of {totalPages}
        </div>
      </div>

      {loading ? (
        <VoterCardsSkeleton count={6} />
      ) : voters.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#94a3b8', borderRadius: '16px' }}>
          <Users size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <h4 style={{ margin: '0 0 0.25rem', color: '#475569' }}>
            {isTelugu ? 'ఎటువంటి ఓటరు రికార్డులు దొరకలేదు' : 'No voter records found'}
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            {isTelugu ? 'దయచేసి మీ శోధన పారామితులను మార్చి మళ్లీ ప్రయత్నించండి.' : 'Try adjusting your search criteria or select another constituency.'}
          </p>
        </div>
      ) : (
        <div className="voter-cards-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {voters.map((voter) => {
            const displayName = isTelugu
              ? (voter.name_te || voter.name_en)
              : (voter.name_en || voter.name_te);

            const displayRelativeName = isTelugu
              ? (voter.relative_name_te || voter.relative_name_en || '—')
              : (voter.relative_name_en || voter.relative_name_te || '—');

            return (
              <div
                key={voter.id}
                className="admin-voter-card"
                style={{
                  background: '#ffffff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '12px',
                  padding: '0.55rem 0.75rem',
                  boxShadow: '0 1px 5px rgba(191, 219, 254, 0.28)',
                  position: 'relative',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Top Header Row: Serial Number (Left) and Voter ID Pill (Right) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    background: '#eff6ff',
                    border: '1px solid #93c5fd',
                    borderRadius: '5px',
                    padding: '1px 7px',
                    color: '#1e40af',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    lineHeight: 1.3
                  }}>
                    {voter.serial_number}
                  </div>

                  <div style={{
                    background: '#e0e7ff',
                    color: '#1e1b4b',
                    borderRadius: '5px',
                    padding: '2px 8px',
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    letterSpacing: '0.3px',
                    lineHeight: 1.3
                  }}>
                    {voter.voter_id || '—'}
                  </div>
                </div>

                {/* Row 1: Name Box with User Icon */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '0.28rem 0.5rem',
                  marginTop: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    minWidth: '20px',
                    minHeight: '20px',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    borderRadius: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <User size={12} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                      {isTelugu ? 'పేరు' : 'Name'} :
                    </span>
                    <span style={{
                      color: '#0f172a',
                      fontWeight: 800,
                      fontSize: '0.76rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {displayName}
                    </span>
                  </div>
                </div>

                {/* Row 2: 2-Column Grid for Relative Name & House Number */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.4rem',
                  marginTop: '0.35rem'
                }}>
                  {/* Column 1: Relative Name */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '0.25rem 0.45rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      minWidth: '20px',
                      minHeight: '20px',
                      background: '#e0f2fe',
                      color: '#0284c7',
                      borderRadius: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Users size={12} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ color: '#64748b', fontSize: '0.60rem', fontWeight: 600, lineHeight: 1.1 }}>
                        {getRelativeLabel(voter.relative_type, isTelugu)}
                      </div>
                      <div style={{
                        color: '#0f172a',
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        marginTop: '1px',
                        wordBreak: 'break-word',
                        lineHeight: 1.15
                      }}>
                        {displayRelativeName}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: House Number */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '0.25rem 0.45rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      minWidth: '20px',
                      minHeight: '20px',
                      background: '#e0f2fe',
                      color: '#0284c7',
                      borderRadius: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Home size={12} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ color: '#64748b', fontSize: '0.60rem', fontWeight: 600, lineHeight: 1.1 }}>
                        {isTelugu ? 'డోర్ నంబర్' : 'House Number'}
                      </div>
                      <div style={{
                        color: '#0f172a',
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        marginTop: '1px',
                        lineHeight: 1.15
                      }}>
                        {voter.house_number || '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 3: 2-Column Grid for Age & Gender */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.4rem',
                  marginTop: '0.35rem'
                }}>
                  {/* Column 1: Age */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '0.25rem 0.45rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      minWidth: '20px',
                      minHeight: '20px',
                      background: '#e0f2fe',
                      color: '#0284c7',
                      borderRadius: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Calendar size={12} />
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.60rem', fontWeight: 600, lineHeight: 1.1 }}>
                        {isTelugu ? 'వయస్సు' : 'Age'}
                      </div>
                      <div style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.72rem', marginTop: '1px', lineHeight: 1.15 }}>
                        {voter.age || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Gender */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '0.25rem 0.45rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      minWidth: '20px',
                      minHeight: '20px',
                      background: '#e0f2fe',
                      color: '#0284c7',
                      borderRadius: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <UserCheck size={12} />
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.60rem', fontWeight: 600, lineHeight: 1.1 }}>
                        {isTelugu ? 'లింగం' : 'Gender'}
                      </div>
                      <div style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.72rem', marginTop: '1px', lineHeight: 1.15 }}>
                        {formatGender(voter.gender, isTelugu)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer Row with Part Info & View/Edit Action */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.45rem',
                  paddingTop: '0.4rem',
                  borderTop: '1px dashed #e2e8f0'
                }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                    {isTelugu ? 'పార్ట్' : 'Part'}: <strong style={{ color: '#0f172a' }}>{voter.part_number || '1'}</strong>
                  </div>

                  <Link
                    to={`/admin/voters/${voter.id}`}
                    style={{
                      height: '26px',
                      padding: '0 0.6rem',
                      borderRadius: '6px',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      textDecoration: 'none',
                      fontSize: '0.7rem',
                      fontWeight: 700
                    }}
                  >
                    <Eye size={12} />
                    <span>{isTelugu ? 'సవరించండి' : 'View / Edit'}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

        {/* Pagination Controls */}
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
              <span>{isTelugu ? 'మునుపటిది' : 'Previous'}</span>
            </button>

            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
              {isTelugu ? `పేజీ ${page} / ${totalPages}` : `Page ${page} of ${totalPages}`}
            </span>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages || loading}
              onClick={() => fetchVoters(page + 1)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <span>{isTelugu ? 'తదుపరిది' : 'Next'}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    );
}
