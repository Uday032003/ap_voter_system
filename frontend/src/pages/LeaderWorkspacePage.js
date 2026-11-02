import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { 
  BookmarkCheck, 
  Search, 
  Filter, 
  MapPin, 
  RefreshCw, 
  AlertCircle, 
  RotateCcw, 
  X, 
  Users, 
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

import VoterCard from '../components/directory/VoterCard.js';
import VoterDetailModal from '../components/directory/VoterDetailModal.js';
import SkeletonLoader from '../components/common/SkeletonLoader.js';

export default function LeaderWorkspacePage() {
  const { t, i18n } = useTranslation();
  const { user, selectedConstituency } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // State
  const [markedRecords, setMarkedRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [queryError, setQueryError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedPart, setSelectedPart] = useState('');
  const [parts, setParts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Modal
  const [activeModalVoter, setActiveModalVoter] = useState(null);

  const constituencyId = selectedConstituency?.id || '';

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load parts for filters
  useEffect(() => {
    async function loadParts() {
      if (!constituencyId) return;
      try {
        const res = await api.getParts(constituencyId);
        if (res.success) {
          setParts(res.data);
        }
      } catch (err) {
        console.error('Failed to load parts:', err);
      }
    }
    loadParts();
  }, [constituencyId]);

  // Fetch only the authenticated Leader's marked records from Supabase
  const fetchMarkedVoters = async (pageToFetch = 1, append = false) => {
    if (pageToFetch === 1) {
      setLoading(true);
      setQueryError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = {
        page: pageToFetch,
        limit: 20,
        search: debouncedSearch
      };
      if (constituencyId) params.constituencyId = constituencyId;
      if (selectedPart) params.partId = selectedPart;
      if (selectedGender) params.gender = selectedGender;

      const res = await api.getMarkedVoters(params);
      if (res.success) {
        const fetchedList = (res.records || []).map(r => ({
          ...r,
          is_marked: true // every record in this list is confirmed marked in Supabase
        }));

        if (append) {
          setMarkedRecords(prev => {
            const existing = new Set(prev.map(item => item.id));
            const fresh = fetchedList.filter(item => !existing.has(item.id));
            return [...prev, ...fresh];
          });
        } else {
          setMarkedRecords(fetchedList);
        }

        setTotalCount(res.totalCount || 0);
        setHasMore(res.hasMore || false);
        setPage(pageToFetch);
        setQueryError(null);
      }
    } catch (err) {
      console.error('Failed to fetch Leader marked voters:', err);
      setQueryError(err.message || 'Failed to load marked voters from database.');
      if (!append) {
        setMarkedRecords([]);
        setTotalCount(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMarkedVoters(1, false);
  }, [constituencyId, debouncedSearch, selectedPart, selectedGender]);

  // Infinite Scroll Observer
  const observerTarget = useRef(null);
  useEffect(() => {
    if (!observerTarget.current || !hasMore || loadingMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchMarkedVoters(page + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page]);

  // Unmark a voter directly from Workspace with rollback on error
  const handleUnmarkVoter = async (voter) => {
    const previousList = [...markedRecords];
    const previousTotal = totalCount;

    // Optimistic UI removal
    setMarkedRecords(prev => prev.filter(r => r.id !== voter.id));
    setTotalCount(prev => Math.max(0, prev - 1));

    try {
      await api.unmarkVoter(voter.id);
      showToast(
        i18n.language === 'te' 
          ? `#${voter.serial_number} రికార్డు వర్క్‌స్పేస్ నుండి తొలగించబడింది`
          : `Removed #${voter.serial_number} from Workspace`, 
        'info'
      );
    } catch (err) {
      // Rollback on failure
      setMarkedRecords(previousList);
      setTotalCount(previousTotal);
      showToast(err.message || 'Failed to unmark voter. Please retry.', 'error');
    }
  };

  const handleVoterUpdated = (updated) => {
    setMarkedRecords(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated, is_marked: true } : r));
  };

  const activeFiltersCount = (selectedPart ? 1 : 0) + (selectedGender ? 1 : 0);

  return (
    <div className="leader-workspace-page">
      {/* Workspace Header Banner */}
      <div className="workspace-hero-card">
        <div className="workspace-hero-inner">
          <div className="workspace-hero-info">
            <div className="workspace-hero-title-row">
              <div className="workspace-badge-icon">
                <BookmarkCheck size={22} />
              </div>
              <div>
                <h1 className="workspace-hero-title">
                  {t('leader.workspace_title', 'Leader Workspace')}
                </h1>
                <p className="workspace-hero-desc">
                  {t('leader.workspace_subtitle', 'Personal administrative marked list for review and outreach')}
                </p>
              </div>
            </div>
          </div>

          <div className="workspace-hero-stats">
            <div className="stat-chip">
              <span className="stat-chip-count">{totalCount}</span>
              <span className="stat-chip-label">{t('leader.marked_records_count', 'Marked Records')}</span>
            </div>
            {selectedConstituency && (
              <div className="scope-chip">
                <MapPin size={14} color="#f59e0b" />
                <span>
                  {i18n.language === 'te' && selectedConstituency.name_te ? selectedConstituency.name_te : selectedConstituency.name_en}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Database Error Banner with Retry */}
      {queryError && (
        <div className="card error-banner-card">
          <div className="error-banner-content">
            <AlertCircle size={22} className="error-icon" />
            <div>
              <h4 className="error-title">Database Error</h4>
              <p className="error-message">{queryError}</p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm error-retry-btn"
            onClick={() => fetchMarkedVoters(1, false)}
          >
            <RotateCcw size={14} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="card directory-toolbar-card">
        <div className="directory-search-row">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-control touch-search-input"
              placeholder={t('leader.search_marked_placeholder', 'Search marked voters by name, Telugu name, serial, or house #...')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              aria-label="Search marked voters"
            />
            <Search size={18} className="search-input-icon" />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button
            type="button"
            className={`btn btn-secondary mobile-filter-toggle ${activeFiltersCount > 0 ? 'has-active-filters' : ''}`}
            onClick={() => setShowFilters(prev => !prev)}
            aria-expanded={showFilters}
          >
            <Filter size={16} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="filter-count-badge">{activeFiltersCount}</span>
            )}
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm refresh-btn"
            onClick={() => fetchMarkedVoters(1, false)}
            title="Refresh Marked Records"
            aria-label="Refresh Marked Records"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Filter Drawer */}
        <div className={`filter-controls-grid ${showFilters ? 'mobile-visible' : ''}`}>
          {/* Roll Part */}
          <div className="filter-item">
            <label className="filter-label">{t('directory.part_filter', 'Roll Part')}</label>
            <select
              className="form-control"
              value={selectedPart}
              onChange={e => setSelectedPart(e.target.value)}
              aria-label="Filter by Part"
            >
              <option value="">{t('directory.all_parts', 'All Parts')}</option>
              {parts.map(p => (
                <option key={p.id} value={p.id}>
                  Part {p.part_number} - {i18n.language === 'te' ? p.part_name_te : p.part_name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div className="filter-item">
            <label className="filter-label">{t('directory.gender_filter', 'Gender')}</label>
            <select
              className="form-control"
              value={selectedGender}
              onChange={e => setSelectedGender(e.target.value)}
              aria-label="Filter by Gender"
            >
              <option value="">{t('directory.gender_all', 'All Genders')}</option>
              <option value="M">{t('directory.male', 'Male')}</option>
              <option value="F">{t('directory.female', 'Female')}</option>
            </select>
          </div>

          {activeFiltersCount > 0 && (
            <div className="filter-item filter-reset-item">
              <button
                type="button"
                className="btn btn-secondary btn-sm filter-reset-btn"
                onClick={() => {
                  setSelectedPart('');
                  setSelectedGender('');
                  setShowFilters(false);
                }}
              >
                <X size={14} />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <SkeletonLoader type="voters" rows={6} isLeader={true} />
      ) : markedRecords.length === 0 ? (
        /* Empty State */
        <div className="card workspace-empty-state">
          <div className="empty-state-icon-wrapper">
            <BookmarkCheck size={36} className="empty-state-icon" />
          </div>
          <h3 className="empty-state-title">
            {t('leader.empty_state_title', 'No records marked yet')}
          </h3>
          <p className="empty-state-desc">
            {t('leader.empty_state_desc', 'Open the Voter List and mark a record to add it to your Workspace.')}
          </p>
          <button
            type="button"
            className="btn btn-primary empty-state-cta-btn"
            onClick={() => navigate('/directory')}
          >
            <Users size={16} />
            <span>{t('leader.open_voter_list', 'Open Voter List')}</span>
          </button>
        </div>
      ) : (
        /* Marked Voter Cards List */
        <div className="workspace-records-view">
          <div className="mobile-cards-view">
            {markedRecords.map(voter => (
              <VoterCard
                key={voter.id}
                voter={voter}
                isSelected={false}
                onToggleMark={handleUnmarkVoter}
                onViewDetails={(v) => setActiveModalVoter(v)}
                canSelect={false}
                canMark={true}
                isLeader={true}
              />
            ))}
          </div>

          {/* Infinite Scroll / Load More */}
          <div className="infinite-scroll-container">
            {hasMore ? (
              <div className="infinite-scroll-status">
                <div ref={observerTarget} style={{ height: '20px' }} />
                {loadingMore ? (
                  <div className="loading-more-text">
                    <span className="spinner-dots">...</span> Loading more marked records...
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm load-more-btn"
                    onClick={() => fetchMarkedVoters(page + 1, true)}
                  >
                    {t('directory.load_more', 'Load More')} ({markedRecords.length} of {totalCount})
                  </button>
                )}
              </div>
            ) : (
              markedRecords.length > 0 && (
                <div className="records-end-text">
                  All {totalCount} marked records loaded
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Voter Detail Modal */}
      {activeModalVoter && (
        <VoterDetailModal
          voter={activeModalVoter}
          isOpen={Boolean(activeModalVoter)}
          onClose={() => setActiveModalVoter(null)}
          onUpdate={handleVoterUpdated}
          canEdit={true}
        />
      )}
    </div>
  );
}
