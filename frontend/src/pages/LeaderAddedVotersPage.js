import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { 
  CheckCircle2, 
  Search, 
  Trash2, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  User,
  Users, 
  Home,
  Calendar,
  UserCheck,
  ArrowUp
} from 'lucide-react';
import { VoterCardsSkeleton } from '../components/common/SkeletonLoader.js';

function getRelativeLabel(relativeType, isTelugu) {
  const norm = (relativeType || '').toLowerCase();
  if (norm.includes('father')) {
    return isTelugu ? 'తండ్రి పేరు' : "Father's Name";
  }
  if (norm.includes('husband')) {
    return isTelugu ? 'భర్త పేరు' : "Husband's Name";
  }
  if (norm.includes('mother')) {
    return isTelugu ? 'తల్లి పేరు' : "Mother's Name";
  }
  if (norm.includes('other')) {
    return isTelugu ? 'సంరక్షకుడి పేరు' : "Guardian's Name";
  }
  return isTelugu ? 'బంధువు పేరు' : (relativeType ? `${relativeType}'s Name` : "Relative's Name");
}

function formatGender(gender, isTelugu) {
  const g = (gender || '').toUpperCase();
  if (g === 'M' || g.startsWith('MALE')) {
    return isTelugu ? 'పురుషుడు (Male)' : 'Male';
  }
  if (g === 'F' || g.startsWith('FEMALE')) {
    return isTelugu ? 'స్త్రీ (Female)' : 'Female';
  }
  if (g === 'O' || g.startsWith('OTHER') || g.startsWith('TG')) {
    return isTelugu ? 'ఇతర (Other)' : 'Other';
  }
  return gender || '—';
}

export default function LeaderAddedVotersPage() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();

  const [voters, setVoters] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sentinelRef = useRef(null);

  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [removingId, setRemovingId] = useState(null);

  const isTelugu = i18n.language === 'te';

  
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadMoreAddedVoters = async () => {
    if (loading || loadingMore || page >= totalPages) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const params = { page: nextPage, limit: 25 };
      if (search.trim()) params.search = search.trim();
      if (gender) params.gender = gender;

      const res = await api.getAddedVoters(params);
      if (res.success && res.records) {
        setVoters(prev => {
          const ids = new Set(prev.map(v => v.id));
          const fresh = res.records.filter(v => !ids.has(v.id));
          return [...prev, ...fresh];
        });
        setPage(nextPage);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.totalCount || 0);
      }
    } catch (err) {
      console.warn('Failed to load next page of added voters:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && !loadingMore && page < totalPages) {
        loadMoreAddedVoters();
      }
    }, { threshold: 0.1, rootMargin: '250px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, loadingMore, page, totalPages, search, gender]);

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

  const handleRemove = async (voter) => {
    try {
      setRemovingId(voter.id);
      setError(null);
      await api.removeVoterFromList(voter.id);
      showToast(
        isTelugu 
          ? `${voter.name_te || voter.name_en || 'ఓటరు'} మీ జాబితా నుండి తొలగించబడ్డారు` 
          : `Removed ${voter.name_en || 'voter'} from your follow-up list.`,
        'info'
      );
      await fetchAddedVoters(page);
    } catch (err) {
      setError(err.message || 'Failed to remove voter.');
      showToast('Failed to remove voter. Please try again.', 'error');
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
              ? 'డైరెక్టరీలో మీరు ఎంచుకున్న ఓటర్ల ప్రత్యక్ష జాబితా.'
              : 'Directly tracks voters added through the directory. Persisted in database.'}
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
              {isTelugu ? 'రీసెట్' : 'Reset'}
            </button>
          )}
        </form>
      </div>

      {/* Roster Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.25rem' }}>
        <div style={{ fontSize: '0.95rem', color: '#475569', fontWeight: 600 }}>
          {isTelugu ? 'మొత్తం చేర్చబడిన ఓటర్లు:' : 'Total Tracked Voters:'}{' '}
          <span style={{ color: '#15803d', fontWeight: 800 }}>{totalCount.toLocaleString()}</span>
        </div>
        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
          Page {page} of {totalPages}
        </div>
      </div>

      {loading ? (
        <VoterCardsSkeleton count={6} />
      ) : voters.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#94a3b8', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <CheckCircle2 size={40} style={{ opacity: 0.3, marginBottom: '0.75rem', color: '#15803d' }} />
          <h4 style={{ margin: '0 0 0.25rem', color: '#475569' }}>
            {isTelugu ? 'మీ జాబితాలో ఇంకా ఓటర్లు లేరు' : 'Your list is empty'}
          </h4>
          <p style={{ margin: '0 0 1rem', fontSize: '0.85rem' }}>
            {isTelugu
              ? 'ఓటరు డైరెక్టరీకి వెళ్లి Add బటన్‌ను నొక్కడం ద్వారా ఓటర్లను చేర్చవచ్చు.'
              : 'Browse the voter directory and click the Add button next to any voter to add them.'}
          </p>
          <Link to="/leader/voters" className="btn btn-primary btn-sm">
            {isTelugu ? 'ఓటరు డైరెక్టరీకి వెళ్లండి' : 'Go to Voter Directory'}
          </Link>
        </div>
      ) : (
        <>
          {/* Compact Voter Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '0.75rem',
            marginTop: '0.5rem'
          }}>
            {voters.map((voter) => {
              const displayName = isTelugu
                ? (voter.name_te || voter.name_en)
                : (voter.name_en || voter.name_te);

              const displayRelativeName = isTelugu
                ? (voter.relative_name_te || voter.relative_name_en || '—')
                : (voter.relative_name_en || voter.relative_name_te || '—');

                const displaySectionName = isTelugu
                  ? (voter.section_name_te || voter.section_name_en)
                  : (voter.section_name_en || voter.section_name_te);

              const isRemoving = removingId === voter.id;

              return (
                <div
                  key={voter.id}
                  className="leader-voter-card"
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #86efac',
                    borderRadius: '12px',
                    padding: '0.55rem 0.75rem',
                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.12)',
                    position: 'relative',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Top Header Row: Serial Number (Left) and Voter ID Pill (Right) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.45rem' }}>
                    <div style={{
                      background: '#eff6ff',
                      border: '1px solid #93c5fd',
                      borderRadius: '5px',
                      padding: '1px 7px',
                      color: '#1e40af',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      lineHeight: 1.3,
                        flexShrink: 0
                    }}>
                      #{voter.serial_number}
                    </div>

                                          {displaySectionName && (
                        <div
                          style={{
                            fontSize: '0.58rem',
                            color: '#64748b',
                            fontWeight: 600,
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            minWidth: 0,
                            flex: 1,
                            padding: '0 0.25rem'
                          }}
                          title={displaySectionName}
                        >
                          {displaySectionName}
                        </div>
                      )}

                      <div style={{
                      background: '#e0e7ff',
                      color: '#1e1b4b',
                      borderRadius: '5px',
                      padding: '2px 8px',
                      fontWeight: 800,
                      fontSize: '0.74rem',
                      letterSpacing: '0.3px',
                      lineHeight: 1.3,
                        flexShrink: 0
                    }}>
                      {voter.voter_id || '—'}
                    </div>
                  </div>

                  {/* Row 1: Name Box with User Icon (Compact, ~half height) */}
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

{/* Bottom Footer Row with Part Info, View Details, and Remove Button */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '0.45rem',
                    paddingTop: '0.4rem',
                    borderTop: '1px dashed #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                        {isTelugu ? 'పార్ట్' : 'Part'}: <strong style={{ color: '#0f172a' }}>{voter.part_number || '1'}</strong>
                      </span>
                      <span style={{ color: '#cbd5e1' }}>•</span>
                      <Link
                        to={`/leader/voters/${voter.id}`}
                        style={{
                          fontSize: '0.68rem',
                          color: '#4f46e5',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          textDecoration: 'none'
                        }}
                      >
                        <Eye size={12} />
                        <span>{isTelugu ? 'వివరాలు' : 'View Full Details'}</span>
                      </Link>
                    </div>

                    {/* Remove Action Button in Red */}
                    <button
                      type="button"
                      onClick={() => handleRemove(voter)}
                      disabled={isRemoving}
                      style={{
                        height: '28px',
                        padding: '0 0.65rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: isRemoving ? '#b91c1c' : '#dc2626',
                        color: '#ffffff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        cursor: isRemoving ? 'not-allowed' : 'pointer',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        boxShadow: '0 1px 4px rgba(220, 38, 38, 0.3)',
                        transition: 'all 0.15s ease'
                      }}
                      title="Remove from my list"
                    >
                      {isRemoving ? (
                        <span>{isTelugu ? 'తొలగిస్తోంది...' : 'Removing...'}</span>
                      ) : (
                        <span>{isTelugu ? 'తొలగించండి' : 'Remove'}</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Infinite Scroll Sentinel */}
          <div ref={sentinelRef} style={{ height: '20px', margin: '0.5rem 0' }} />

          {/* Loading Next Batch Indicator */}
          {loadingMore && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '1.25rem',
              color: '#15803d',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}>
              <RefreshCw size={16} className="spin" />
              <span>{isTelugu ? 'తదుపరి 25 ఓటర్లను లోడ్ చేస్తోంది...' : 'Loading next 25 voters...'}</span>
            </div>
          )}

          {/* End of List Indicator */}
          {!loading && !loadingMore && page >= totalPages && voters.length > 0 && (
            <div style={{
              textAlign: 'center',
              padding: '1.5rem 1rem',
              color: '#64748b',
              fontSize: '0.82rem',
              fontWeight: 600
            }}>
              ✓ {isTelugu ? `మొత్తం ${totalCount.toLocaleString()} ఓటర్లు లోడ్ చేయబడ్డాయి` : `All ${totalCount.toLocaleString()} voters loaded`}
            </div>
          )}

          {/* Floating Back-to-Top Button */}
          {showScrollTop && (
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{
                position: 'fixed',
                bottom: '72px',
                right: '18px',
                zIndex: 900,
                background: '#15803d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '24px',
                padding: '0.5rem 0.9rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 4px 14px rgba(21, 128, 61, 0.35)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease'
              }}
              title={isTelugu ? 'పైకి స్క్రోల్ చేయండి' : 'Back to top'}
            >
              <ArrowUp size={15} />
              <span>{isTelugu ? 'పైకి' : 'Top'}</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
