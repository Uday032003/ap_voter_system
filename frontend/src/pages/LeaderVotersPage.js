import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import ConstituencySelector from '../components/constituency/ConstituencySelector.js';
import { VoterTableSkeleton } from '../components/common/SkeletonLoader.js';
import { 
  Users, 
  Search, 
  Check, 
  Plus, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Lock,
  Layers
} from 'lucide-react';

export default function LeaderVotersPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

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

  useEffect(() => {
    checkAccessAndLoad();
  }, []);

  const loadVoters = async (targetPage = 1, constituencyId = dashboardStats?.constituency?.id) => {
    if (!constituencyId) return;

    try {
      setLoadingVoters(true);
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
      setError(err.message || 'Failed to load voters roll.');
    } finally {
      setLoadingVoters(false);
    }
  };

  const handleConstituencyConfirmed = async (mptcId) => {
    await checkAccessAndLoad();
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

      // Refresh stats count
      api.getLeaderDashboardStats().then(r => {
        if (r.success) setDashboardStats(r.data);
      });
    } catch (err) {
      setError(err.message || 'Failed to update voter status.');
    } finally {
      setMarkingIds(prev => ({ ...prev, [voterId]: false }));
    }
  };

  const handleSubmitAccessRequest = async (e) => {
    e.preventDefault();
    if (!dashboardStats?.constituency?.id) {
      setError('Please select an MPTC constituency first.');
      return;
    }

    try {
      setSubmittingRequest(true);
      setError(null);
      await api.submitAccessRequest({
        mptc_village_constituency_id: dashboardStats.constituency.id,
        justification: justification.trim() || 'Leader constituency administrative tracking.'
      });
      setRequestModalOpen(false);
      setSuccessMsg('Access request submitted successfully to Super Admin.');
      await checkAccessAndLoad();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to submit access request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const accessStatus = dashboardStats?.accessStatus || 'none';
  const constituency = dashboardStats?.constituency;

  return (
    <div className="leader-voters-page" style={{ paddingBottom: '3.5rem' }}>
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
              ? 'ఓటర్లను మీ పరిపాలనా ఫాలో-అప్ జాబితాలోకి చేర్చడానికి టిక్ (✓) బటన్‌ను నొక్కండి.'
              : 'Add voters to your private administrative follow-up roster using the tick button.'}
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

      {/* While loading leader authorization status, show skeleton instead of "Approval Required" error cards */}
      {loadingStats && !dashboardStats ? (
        <div style={{ marginTop: '1.5rem' }}>
          <VoterTableSkeleton count={8} />
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
        /* Protected Voter Directory with Tick Action */
        <>
          {/* Search Bar */}
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

          {/* Directory Content */}
          <div className="card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
                {isTelugu ? 'మొత్తం ఓటర్లు:' : 'Roll Count:'}{' '}
                <span style={{ color: '#0f172a', fontWeight: 800 }}>{totalCount.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Page {page} of {totalPages}
              </div>
            </div>

            {loadingVoters ? (
              <VoterTableSkeleton rows={8} isLeader={true} />
            ) : voters.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                No voters found matching your criteria.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'center', width: '90px' }}>
                        {isTelugu ? 'జాబితా' : 'My List'}
                      </th>
                      <th style={{ padding: '0.75rem' }}>{isTelugu ? 'సీరియల్' : 'Sl. No'}</th>
                      <th style={{ padding: '0.75rem' }}>{isTelugu ? 'ఓటరు పేరు (తెలుగు & English)' : 'Voter Name'}</th>
                      <th style={{ padding: '0.75rem' }}>{isTelugu ? 'బంధువు పేరు' : 'Relative Name'}</th>
                      <th style={{ padding: '0.75rem' }}>{isTelugu ? 'ఓటరు ఐడి' : 'EPIC'}</th>
                      <th style={{ padding: '0.75rem' }}>{isTelugu ? 'డోర్ నం.' : 'House No.'}</th>
                      <th style={{ padding: '0.75rem' }}>{isTelugu ? 'వయస్సు / లింగం' : 'Age/Sex'}</th>
                      <th style={{ padding: '0.75rem' }}>{isTelugu ? 'పార్ట్ నం.' : 'Part'}</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>{isTelugu ? 'వివరాలు' : 'Details'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voters.map((voter) => {
                      const isAdded = Boolean(voter.is_added || voter.is_marked);
                      const isMarking = Boolean(markingIds[voter.id]);

                      return (
                        <tr key={voter.id} style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: isAdded ? '#f0fdf4' : 'transparent',
                          transition: 'background 0.2s'
                        }}>
                          {/* Tick / Add Button (Touch Target >= 44x44px) */}
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleAddVoter(voter)}
                              disabled={isMarking}
                              title={isAdded ? 'Remove from My List' : 'Add to My List'}
                              style={{
                                width: '44px',
                                height: '44px',
                                minWidth: '44px',
                                minHeight: '44px',
                                borderRadius: '10px',
                                border: isAdded ? '2px solid #16a34a' : '2px solid #cbd5e1',
                                background: isAdded ? '#16a34a' : '#ffffff',
                                color: isAdded ? '#ffffff' : '#64748b',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {isMarking ? (
                                <RefreshCw size={18} className="spin" />
                              ) : isAdded ? (
                                <Check size={20} strokeWidth={3} />
                              ) : (
                                <Plus size={20} />
                              )}
                            </button>
                          </td>

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
                            <Link
                              to={`/leader/voters/${voter.id}`}
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
                            >
                              <Eye size={13} />
                              <span>{isTelugu ? 'వివరాలు' : 'View'}</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
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
                  disabled={page <= 1 || loadingVoters}
                  onClick={() => loadVoters(page - 1)}
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
                  disabled={page >= totalPages || loadingVoters}
                  onClick={() => loadVoters(page + 1)}
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
