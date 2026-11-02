import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import ConstituencySelector from '../components/constituency/ConstituencySelector.js';
import { VoterCardsSkeleton } from '../components/common/SkeletonLoader.js';
import { 
  User,
  Users, 
  Home,
  Calendar,
  UserCheck,
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  MapPin,
  CheckCircle2
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
  const [selectedSection, setSelectedSection] = useState('');
  const [sortBy, setSortBy] = useState('serial');
  const [sections, setSections] = useState([]);

  const isTelugu = i18n.language === 'te';

  const loadSections = async (constituencyId = selectedConstituency?.id) => {
    try {
      const res = await api.getSections({ constituencyId });
      if (res.success) {
        setSections(res.data || []);
      }
    } catch (e) {
      console.warn('Failed to load sections:', e);
    }
  };

  useEffect(() => {
    if (selectedConstituency?.id) {
      loadSections(selectedConstituency.id);
    }
  }, [selectedConstituency]);

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
      if (selectedSection.trim()) params.section = selectedSection.trim();
      if (sortBy) params.sortBy = sortBy;

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
            <form onSubmit={(e) => { e.preventDefault(); fetchVoters(1); }} style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 200px', position: 'relative' }}>
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

              {/* Section Filter Dropdown */}
              <div style={{ minWidth: '150px', flex: '1 1 150px' }}>
                <select className="form-control" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
                  <option value="">{isTelugu ? 'విభాగం (అన్నీ)' : 'All Sections'}</option>
                  {sections.map((sec) => (
                    <option key={sec.section_name_en} value={sec.section_name_en}>
                      {isTelugu && sec.section_name_te ? sec.section_name_te : sec.section_name_en} ({sec.voter_count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div style={{ width: '135px' }}>
                <select className="form-control" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="serial">{isTelugu ? 'వరుస సంఖ్య' : 'Sort: Sl. No'}</option>
                  <option value="section">{isTelugu ? 'విభాగం ప్రకారం' : 'Sort: Section'}</option>
                </select>
              </div>

              <div style={{ width: '115px' }}>
                <select className="form-control" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">{isTelugu ? 'లింగం (అన్నీ)' : 'All Genders'}</option>
                  <option value="M">Male (M)</option>
                  <option value="F">Female (F)</option>
                  <option value="O">Other (O)</option>
                </select>
              </div>

              <div style={{ width: '100px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder={isTelugu ? 'పార్ట్ నం.' : 'Part No.'}
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.1rem' }}>
                {isTelugu ? 'శోధించండి' : 'Search'}
              </button>

              {(search || gender || partNumber || selectedSection || sortBy !== 'serial') && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearch('');
                    setGender('');
                    setPartNumber('');
                    setSelectedSection('');
                    setSortBy('serial');
                    fetchVoters(1);
                  }}
                >
                  {isTelugu ? 'రీసెట్' : 'Reset'}
                </button>
              )}
            </form>
          </div>

          {/* Roll Records Cards */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem', padding: '0 0.25rem' }}>
            <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
              {isTelugu ? 'రిజిస్టర్ అయిన ఓటర్లు:' : 'Registered Voters Found:'}{' '}
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
                {isTelugu ? 'ఓటరు రికార్డులు కనిపించలేదు' : 'No matching voter records found'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                {isTelugu ? 'శోధన పదాన్ని సరిచూసుకోండి లేదా నియోజకవర్గాన్ని మార్చండి.' : 'Verify the spelling or check another part number.'}
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
                    className="commoner-voter-card"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #bbf7d0',
                      borderRadius: '12px',
                      padding: '0.55rem 0.75rem',
                      boxShadow: '0 1px 5px rgba(34, 197, 94, 0.12)',
                      position: 'relative',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Top Header Row: Serial Number (Left) and Voter ID Pill (Right) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: '5px',
                        padding: '1px 7px',
                        color: '#15803d',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        lineHeight: 1.3
                      }}>
                        {voter.serial_number}
                      </div>

                      <div style={{
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        color: '#065f46',
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

                    {/* Row 1: Name Box with User Icon (Green theme icon) */}
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
                        background: '#dcfce7',
                        color: '#15803d',
                        borderRadius: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <User size={12} color="#15803d" />
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

                    {/* Row 2: 2-Column Grid for Relative Name & House Number (Green theme icons) */}
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
                          background: '#dcfce7',
                          color: '#15803d',
                          borderRadius: '5px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Users size={12} color="#15803d" />
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
                          background: '#dcfce7',
                          color: '#15803d',
                          borderRadius: '5px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Home size={12} color="#15803d" />
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

                    {/* Row 3: 2-Column Grid for Age & Gender (Green theme icons) */}
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
                          background: '#dcfce7',
                          color: '#15803d',
                          borderRadius: '5px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Calendar size={12} color="#15803d" />
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
                          background: '#dcfce7',
                          color: '#15803d',
                          borderRadius: '5px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <UserCheck size={12} color="#15803d" />
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

                    {/* Bottom Footer Row with Part Info, Section Badge & Verified AP E-Roll Status */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '0.45rem',
                      paddingTop: '0.4rem',
                      borderTop: '1px dashed #e2e8f0',
                      flexWrap: 'wrap',
                      gap: '0.35rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                          {isTelugu ? 'పార్ట్' : 'Part'}: <strong style={{ color: '#0f172a' }}>{voter.part_number || '1'}</strong>
                        </span>

                        {(voter.section_name_en || voter.section_name_te) && (
                          <>
                            <span style={{ color: '#cbd5e1' }}>•</span>
                            <span style={{
                              fontSize: '0.65rem',
                              color: '#15803d',
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontWeight: 600
                            }}>
                              {isTelugu && voter.section_name_te ? voter.section_name_te : voter.section_name_en}
                            </span>
                          </>
                        )}
                      </div>

                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#15803d',
                        background: '#f0fdf4',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: '1px solid #bbf7d0'
                      }}>
                        <CheckCircle2 size={11} color="#16a34a" />
                        <span>{isTelugu ? 'ధృవీకరించబడిన ఓటరు' : 'Verified AP E-Roll'}</span>
                      </div>
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
          </>
        )}
      </div>
    );
}
