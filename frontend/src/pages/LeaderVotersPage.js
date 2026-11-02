import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import ConstituencySelector from '../components/constituency/ConstituencySelector.js';
import { VoterCardsSkeleton } from '../components/common/SkeletonLoader.js';
import { 
  User,
  Users, 
  Home,
  Calendar,
  UserCheck,
  Search, 
  Check, 
  Clock, 
  Lock, 
  AlertCircle, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Eye
} from 'lucide-react';

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

export default function LeaderVotersPage() {
  const { t, i18n } = useTranslation();
  const { user, selectedConstituency } = useAuth();
  const { showToast } = useToast();

  const [dashboardStats, setDashboardStats] = useState(() => {
    try {
      const saved = sessionStorage.getItem('ap_voters_leader_stats');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [loadingStats, setLoadingStats] = useState(!dashboardStats);

  // Directory state
  const [voters, setVoters] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingVoters, setLoadingVoters] = useState(false);
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [partNumber, setPartNumber] = useState('');

  // Ticking / Add to list tracking
  const [markingIds, setMarkingIds] = useState({});

  // Request Access modal
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [justification, setJustification] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const isTelugu = i18n.language === 'te';

  const activeConstituencyId = selectedConstituency?.id || dashboardStats?.constituency?.id;

  const loadVoters = async (targetPage = 1, constituencyId = activeConstituencyId) => {
    const targetId = constituencyId || activeConstituencyId;
    if (!targetId) return;

    try {
      setLoadingVoters(true);
      setError(null);

      const params = {
        constituencyId: targetId,
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
      setError(err.message || 'Failed to load voters roll.');
    } finally {
      setLoadingVoters(false);
    }
  };

  const checkAccessAndLoad = async () => {
    try {
      setLoadingStats(true);
      setError(null);
      const res = await api.getLeaderDashboardStats();
      if (res.success) {
        setDashboardStats(res.data);
        try {
          sessionStorage.setItem('ap_voters_leader_stats', JSON.stringify(res.data));
        } catch (e) {}
        if (res.data.accessStatus === 'approved' && res.data.constituency) {
          loadVoters(1, res.data.constituency.id);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to verify leader constituency access.');
    } finally {
      setLoadingStats(false);
    }
  };

  // Immediate load on mount if constituency ID is known from AuthContext/localStorage
  useEffect(() => {
    if (activeConstituencyId) {
      loadVoters(1, activeConstituencyId);
    }
    checkAccessAndLoad();
  }, [selectedConstituency?.id]);

  const handleConstituencyConfirmed = async (mptcId) => {
    await checkAccessAndLoad();
    if (mptcId) {
      loadVoters(1, mptcId);
    }
  };

  const handleToggleAddVoter = async (voter) => {
    const voterId = voter.id;
    const isCurrentlyAdded = Boolean(voter.is_added || voter.is_marked);

    try {
      setMarkingIds(prev => ({ ...prev, [voterId]: true }));
      setError(null);

      if (isCurrentlyAdded) {
        await api.removeVoterFromList(voterId);
      } else {
        await api.addVoterToList(voterId);
      }

      // Update local state directly upon server confirmation
      setVoters(prev => prev.map(v => {
        if (v.id === voterId) {
          return { ...v, is_added: !isCurrentlyAdded, is_marked: !isCurrentlyAdded };
        }
        return v;
      }));

      // Trigger bottom-right toast on successful response
      if (!isCurrentlyAdded) {
        showToast(
          isTelugu ? 'ఓటరు విజయవంతంగా మీ జాబితాలోకి చేర్చబడ్డారు' : 'Voter added to your list',
          'success'
        );
      } else {
        showToast(
          isTelugu ? 'ఓటరు మీ జాబితా నుండి తొలగించబడ్డారు' : 'Voter removed from your list',
          'info'
        );
      }

      // Refresh leader dashboard stats in background
      api.getLeaderDashboardStats().then(r => {
        if (r.success) {
          setDashboardStats(r.data);
          try {
            sessionStorage.setItem('ap_voters_leader_stats', JSON.stringify(r.data));
          } catch (e) {}
        }
      });
    } catch (err) {
      showToast(err.message || 'Failed to update voter status.', 'error');
    } finally {
      setMarkingIds(prev => ({ ...prev, [voterId]: false }));
    }
  };

  const handleSubmitAccessRequest = async (e) => {
    e.preventDefault();
    const targetId = activeConstituencyId;
    if (!targetId) {
      setError('Please select an MPTC constituency first.');
      return;
    }

    try {
      setSubmittingRequest(true);
      setError(null);
      await api.submitAccessRequest({
        mptc_village_constituency_id: targetId,
        justification: justification.trim() || 'Leader constituency administrative tracking.'
      });
      setRequestModalOpen(false);
      showToast('Access request submitted successfully to Super Admin.', 'success');
      await checkAccessAndLoad();
    } catch (err) {
      setError(err.message || 'Failed to submit access request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const accessStatus = dashboardStats?.accessStatus || 'none';
  const constituency = dashboardStats?.constituency || selectedConstituency;

  return (
    <div className="leader-voters-page" style={{ paddingBottom: '4rem' }}>
      <div className="page-header-container">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-accent page-badge">LEADER DIRECTORY</span>
          </div>
          <h1 className="page-title">
            {isTelugu ? 'ఓటరు డైరెక్టరీ & పరిపాలనా జాబితా' : 'Constituency Voter Directory'}
          </h1>
          <p className="page-subtitle">
            {isTelugu
              ? 'ఓటర్లను మీ పరిపాలనా ఫాలో-అప్ జాబితాలోకి చేర్చడానికి గ్రీన్ టిక్ (✓) బటన్‌ను నొక్కండి.'
              : 'Add voters to your private administrative follow-up roster using the green tick (✓) button.'}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => loadVoters(page)}
          disabled={loadingVoters || accessStatus !== 'approved'}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={15} className={loadingVoters ? 'spin' : ''} />
          <span>{isTelugu ? 'తాజాకరించు' : 'Refresh'}</span>
        </button>
      </div>

      {/* Constituency Selector Banner */}
      <ConstituencySelector onSelectionConfirmed={handleConstituencyConfirmed} />

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

      {/* While loading leader authorization status, show skeleton cards instead of "Approval Required" error */}
      {loadingStats && !dashboardStats ? (
        <div style={{ marginTop: '1.5rem' }}>
          <VoterCardsSkeleton count={6} />
        </div>
      ) : accessStatus !== 'approved' ? (
        <div className="card" style={{
          padding: '2.5rem 1.5rem',
          borderRadius: '16px',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          background: '#ffffff'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: accessStatus === 'pending' ? '#fef3c7' : '#fee2e2',
            color: accessStatus === 'pending' ? '#d97706' : '#dc2626',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            {accessStatus === 'pending' ? <Clock size={28} /> : <Lock size={28} />}
          </div>

          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            {accessStatus === 'pending'
              ? (isTelugu ? 'అనుమతి అభ్యర్థన పెండింగ్‌లో ఉంది' : 'Access Request Pending Approval')
              : accessStatus === 'rejected'
              ? (isTelugu ? 'అనుమతి అభ్యర్థన తిరస్కరించబడింది' : 'Access Request Rejected')
              : accessStatus === 'revoked'
              ? (isTelugu ? 'ఈ నియోజకవర్గ అనుమతి రద్దు చేయబడింది' : 'Constituency Access Revoked')
              : (isTelugu ? 'నియోజకవర్గ అనుమతి అవసరం' : 'Super Admin Approval Required')}
          </h3>

          <p style={{ maxWidth: '540px', margin: '0 auto 1.5rem', color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>
            {accessStatus === 'pending'
              ? (isTelugu
                ? 'మీ నియోజకవర్గ అభ్యర్థన సూపర్ అడ్మిన్ వద్ద పెండింగ్‌లో ఉంది. ఆమోదం లభించిన తర్వాత మాత్రమే ఓటరు రికార్డులు అందుబాటులోకి వస్తాయి.'
                : 'Your access request is currently awaiting Super Admin review. Protected roll data will become visible as soon as it is approved.')
              : (isTelugu
                ? 'ఈ నియోజకవర్గంలోని ఓటరు రికార్డులను వీక్షించడానికి మరియు పరిపాలనా ట్రాకింగ్ నిర్వహించడానికి సూపర్ అడ్మిన్ అనుమతి అభ్యర్థించండి.'
                : 'To access the protected electoral roll and track voters for this constituency, submit an authorization request to the Super Admin.')}
          </p>

          {accessStatus !== 'pending' && constituency && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setRequestModalOpen(true)}
              style={{ minWidth: '180px', fontWeight: 700 }}
            >
              <span>{isTelugu ? 'అనుమతి అభ్యర్థించండి' : 'Request Access Now'}</span>
            </button>
          )}
        </div>
      ) : (
        /* Protected Voter Directory - Mobile-First Cards UI (No Horizontal Scrolling) */
        <>
          {/* Search & Filter Bar */}
          <div className="card" style={{ padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <form onSubmit={(e) => { e.preventDefault(); loadVoters(1); }} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 240px', position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder={isTelugu ? 'పేరు, ఓటరు ఐడి, డోర్ నంబర్...' : 'Search name (EN/TE), Voter ID, house number...'}
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
                    loadVoters(1);
                  }}
                >
                  {isTelugu ? 'రీసెట్' : 'Reset'}
                </button>
              )}
            </form>
          </div>

          {/* Directory Content Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem', padding: '0 0.25rem' }}>
            <div style={{ fontSize: '0.95rem', color: '#475569', fontWeight: 600 }}>
              {isTelugu ? 'మొత్తం ఓటర్లు:' : 'Roll Count:'}{' '}
              <span style={{ color: '#0f172a', fontWeight: 800 }}>{totalCount.toLocaleString()}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
              Page {page} of {totalPages}
            </div>
          </div>

          {/* Voter Card List - Exactly matches Image 2 (No horizontal scroll) */}
          {loadingVoters ? (
            <VoterCardsSkeleton count={6} />
          ) : voters.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', borderRadius: '16px' }}>
              No voters found matching your criteria.
            </div>
          ) : (
            <div className="voter-cards-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {voters.map((voter) => {
                const isAdded = Boolean(voter.is_added || voter.is_marked);
                const isMarking = Boolean(markingIds[voter.id]);

                return (
                  <div
                    key={voter.id}
                    className="leader-voter-card"
                    style={{
                      background: '#ffffff',
                      border: isAdded ? '1.5px solid #86efac' : '1.5px solid #dbeafe',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      boxShadow: isAdded 
                        ? '0 4px 14px rgba(34, 197, 94, 0.12)' 
                        : '0 4px 14px rgba(219, 234, 254, 0.45)',
                      position: 'relative',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Top Header Row: Serial Number (Left) and Voter ID Pill (Right) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{
                        background: '#eff6ff',
                        border: '1.5px solid #93c5fd',
                        borderRadius: '8px',
                        padding: '0.2rem 0.9rem',
                        color: '#1e40af',
                        fontWeight: 800,
                        fontSize: '1.25rem',
                        letterSpacing: '0.5px'
                      }}>
                        {voter.serial_number}
                      </div>

                      <div style={{
                        background: '#e0e7ff',
                        color: '#1e1b4b',
                        borderRadius: '8px',
                        padding: '0.35rem 0.95rem',
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        letterSpacing: '0.5px'
                      }}>
                        {voter.voter_id || '—'}
                      </div>
                    </div>

                    {/* Row 1: Name Box with User Icon */}
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '0.75rem 1rem',
                      marginTop: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        background: '#e0f2fe',
                        color: '#0284c7',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <User size={19} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ color: '#475569', fontWeight: 600, fontSize: '0.92rem' }}>
                          {isTelugu ? 'పేరు' : 'Name'}
                        </span>
                        <span style={{ color: '#94a3b8' }}>:</span>
                        <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.05rem', textTransform: 'uppercase' }}>
                          {voter.name_en || voter.name_te}
                        </span>
                        {voter.name_te && voter.name_en !== voter.name_te && (
                          <span style={{ color: '#64748b', fontSize: '0.88rem', fontWeight: 600 }}>
                            • {voter.name_te}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Row 2: 2-Column Grid for Relative Name & House Number */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '0.75rem',
                      marginTop: '0.75rem'
                    }}>
                      {/* Column 1: Relative Name */}
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem'
                      }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          background: '#e0f2fe',
                          color: '#0284c7',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Users size={17} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
                            {getRelativeLabel(voter.relative_type, isTelugu)}
                          </div>
                          <div style={{
                            color: '#0f172a',
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {voter.relative_name_en || voter.relative_name_te || '—'}
                          </div>
                        </div>
                      </div>

                      {/* Column 2: House Number */}
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem'
                      }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          background: '#e0f2fe',
                          color: '#0284c7',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Home size={17} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
                            {isTelugu ? 'డోర్ నంబర్' : 'House Number'}
                          </div>
                          <div style={{
                            color: '#0f172a',
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {voter.house_number || '—'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: 2-Column Grid for Age & Gender */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '0.75rem',
                      marginTop: '0.75rem'
                    }}>
                      {/* Column 1: Age */}
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem'
                      }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          background: '#e0f2fe',
                          color: '#0284c7',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Calendar size={17} />
                        </div>
                        <div>
                          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
                            {isTelugu ? 'వయస్సు' : 'Age'}
                          </div>
                          <div style={{ color: '#0f172a', fontWeight: 800, fontSize: '1rem' }}>
                            {voter.age || '—'}
                          </div>
                        </div>
                      </div>

                      {/* Column 2: Gender */}
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem'
                      }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          background: '#e0f2fe',
                          color: '#0284c7',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <UserCheck size={17} />
                        </div>
                        <div>
                          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
                            {isTelugu ? 'లింగం' : 'Gender'}
                          </div>
                          <div style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.95rem' }}>
                            {formatGender(voter.gender, isTelugu)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Footer Row with Part Info, View Details, and Tick Button at Bottom Right */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '0.95rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px dashed #e2e8f0',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                          {isTelugu ? 'పార్ట్ నం.' : 'Part'}:{' '}
                          <strong style={{ color: '#0f172a' }}>{voter.part_number || '1'}</strong>
                        </span>

                        <Link
                          to={`/leader/voters/${voter.id}`}
                          style={{
                            fontSize: '0.8rem',
                            color: '#4f46e5',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            textDecoration: 'none'
                          }}
                        >
                          <Eye size={14} />
                          <span>{isTelugu ? 'పూర్తి వివరాలు' : 'View Full Details'}</span>
                        </Link>
                      </div>

                      {/* Tick Button with Green Border at the Bottom Right of Container */}
                      <button
                        type="button"
                        onClick={() => handleToggleAddVoter(voter)}
                        disabled={isMarking}
                        title={isAdded ? (isTelugu ? 'జాబితా నుండి తొలగించండి' : 'Remove from My List') : (isTelugu ? 'జాబితాలోకి చేర్చండి' : 'Add to My List')}
                        style={{
                          width: '44px',
                          height: '44px',
                          minWidth: '44px',
                          minHeight: '44px',
                          borderRadius: '10px',
                          border: '2px solid #16a34a',
                          background: isAdded ? '#16a34a' : '#ffffff',
                          color: isAdded ? '#ffffff' : '#16a34a',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: isMarking ? 'not-allowed' : 'pointer',
                          boxShadow: isAdded ? '0 3px 8px rgba(22, 163, 74, 0.35)' : '0 2px 4px rgba(0,0,0,0.04)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isMarking ? (
                          <RefreshCw size={19} className="spin" color={isAdded ? '#ffffff' : '#16a34a'} />
                        ) : (
                          <Check size={22} strokeWidth={isAdded ? 3.2 : 2.6} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0'
            }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page <= 1 || loadingVoters}
                onClick={() => loadVoters(page - 1)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <ChevronLeft size={16} />
                <span>{isTelugu ? 'మునుపటిది' : 'Previous'}</span>
              </button>

              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages || loadingVoters}
                onClick={() => loadVoters(page + 1)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <span>{isTelugu ? 'తదుపరిది' : 'Next'}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Request Access Modal */}
      {requestModalOpen && (
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
            padding: '1.75rem',
            borderRadius: '16px',
            background: '#ffffff',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Request Constituency Access
            </h3>
            <p style={{ margin: '0 0 1.25rem', color: '#64748b', fontSize: '0.88rem' }}>
              Submit an authorization request to the Super Admin to access voter roll data for{' '}
              <strong>{constituency?.name_en}</strong>.
            </p>

            <form onSubmit={handleSubmitAccessRequest}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Administrative Justification / Reason *
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="e.g. Assigned constituency coordinator for MPTC electoral roll verification..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRequestModalOpen(false)}
                  disabled={submittingRequest}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingRequest}
                  style={{ minWidth: '140px' }}
                >
                  {submittingRequest ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
