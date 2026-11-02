import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { 
  Search, 
  Filter, 
  MapPin, 
  CheckSquare, 
  Users, 
  RefreshCw, 
  ChevronDown, 
  AlertCircle,
  X,
  RotateCcw
} from 'lucide-react';

import VoterTable from '../components/directory/VoterTable.js';
import VoterDetailModal from '../components/directory/VoterDetailModal.js';
import BulkActionToolbar from '../components/directory/BulkActionToolbar.js';
import SkeletonLoader from '../components/common/SkeletonLoader.js';

export default function DirectoryPage() {
  const { t, i18n } = useTranslation();
  const { user, selectedConstituency } = useAuth();
  const { showToast } = useToast();

  // Directory State
  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [queryError, setQueryError] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPart, setSelectedPart] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [parts, setParts] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Selection & Modal State
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeModalVoter, setActiveModalVoter] = useState(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const constituencyId = selectedConstituency?.id || 'c1111111-0000-0000-0000-000000000001';

  // Load parts for filter dropdown
  useEffect(() => {
    async function fetchParts() {
      try {
        const res = await api.getParts(constituencyId);
        if (res.success) {
          setParts(res.data);
        }
      } catch (err) {
        console.error('Failed to load parts:', err);
      }
    }
    fetchParts();
  }, [constituencyId]);

  // Fetch voters from real Supabase DB
  const fetchVoters = async (pageToFetch = 1, append = false) => {
    if (pageToFetch === 1) {
      setLoading(true);
      setQueryError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = {
        constituencyId,
        page: pageToFetch,
        limit: 25,
        search: debouncedSearch
      };
      if (selectedPart) params.partId = selectedPart;
      if (selectedStatus) params.reviewStatus = selectedStatus;
      if (selectedGender) params.gender = selectedGender;

      const res = await api.getVoters(params);
      if (res.success) {
        if (append) {
          setRecords(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const newRecords = res.records.filter(r => !existingIds.has(r.id));
            return [...prev, ...newRecords];
          });
        } else {
          setRecords(res.records || []);
        }
        setTotalCount(res.totalCount || 0);
        setHasMore(res.hasMore || false);
        setPage(pageToFetch);
        setQueryError(null);
      }
    } catch (err) {
      console.error('Database query error:', err);
      setQueryError(err.message || 'Database connection error. Failed to load voters from Supabase.');
      if (!append) {
        setRecords([]);
        setTotalCount(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchVoters(1, false);
  }, [constituencyId, debouncedSearch, selectedPart, selectedStatus, selectedGender]);

  // Infinite Scroll Observer Setup
  const observerTarget = useRef(null);
  useEffect(() => {
    if (!observerTarget.current || !hasMore || loadingMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchVoters(page + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page]);

  // Touch-Friendly Per-Voter Administrative Marking (Persisted in Supabase leader_voter_marks)
  const handleToggleMark = async (voter) => {
    const previousState = Boolean(voter.is_marked);
    const nextState = !previousState;

    // Optimistic UI update
    setRecords(prev => prev.map(r => r.id === voter.id ? { ...r, is_marked: nextState } : r));

    try {
      if (nextState) {
        await api.markVoter(voter.id);
        showToast(
          i18n.language === 'te' 
            ? `#${voter.serial_number} రికార్డును వర్క్‌స్పేస్‌లో చేర్చారు` 
            : `Marked #${voter.serial_number} for Leader Workspace`, 
          'success'
        );
      } else {
        await api.unmarkVoter(voter.id);
        showToast(
          i18n.language === 'te' 
            ? `#${voter.serial_number} రికార్డును తొలగించారు` 
            : `Unmarked #${voter.serial_number} from Leader Workspace`, 
          'info'
        );
      }
    } catch (err) {
      // Rollback on server failure
      setRecords(prev => prev.map(r => r.id === voter.id ? { ...r, is_marked: previousState } : r));
      showToast(err.message || 'Failed to update administrative mark. Please retry.', 'error');
    }
  };

  // Selection handlers
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllPage = (shouldSelect) => {
    const pageIds = records.map(r => r.id);
    if (shouldSelect) {
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleSelectAllLoaded = () => {
    const allLoadedIds = records.map(r => r.id);
    setSelectedIds(allLoadedIds);
    showToast(`Selected ${allLoadedIds.length} loaded records`, 'info');
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleBulkComplete = () => {
    fetchVoters(1, false);
  };

  const handleVoterUpdated = (updatedVoter) => {
    setRecords(prev => prev.map(r => r.id === updatedVoter.id ? updatedVoter : r));
  };

  const isLeader = user?.role === 'leader' || user?.role === 'super_admin';
  const activeFiltersCount = (selectedPart ? 1 : 0) + (selectedStatus ? 1 : 0) + (selectedGender ? 1 : 0);

  return (
    <div className="directory-page-wrapper">
      {/* Directory Title & Header Bar */}
      <div className="directory-header-bar">
        <div>
          <h2 className="directory-title">
            {t('directory.title', 'Voter Directory')}
          </h2>
          <p className="directory-subtitle">
            {t('directory.subtitle', 'Electoral Roll')} • <strong>{selectedConstituency?.name_en || 'Atmakuru MPTC - 04'}</strong>
          </p>
        </div>

        <div className="directory-header-stats">
          <span className="badge badge-primary badge-lg">
            <Users size={14} />
            {totalCount.toLocaleString()} {t('directory.total_records', 'Voters')}
          </span>

          {records.length > 0 && isLeader && (
            <button
              type="button"
              className="btn btn-secondary btn-sm hide-mobile"
              onClick={handleSelectAllLoaded}
              title="Select loaded records"
            >
              <CheckSquare size={14} />
              {t('directory.select_all_loaded', 'Select All')} ({records.length})
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fetchVoters(1, false)}
            title="Refresh Directory"
            aria-label="Refresh Directory"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Database Error Banner with Retry */}
      {queryError && (
        <div className="card error-banner-card">
          <div className="error-banner-content">
            <AlertCircle size={22} className="error-icon" />
            <div>
              <h4 className="error-title">Database Query Error</h4>
              <p className="error-message">{queryError}</p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm error-retry-btn"
            onClick={() => fetchVoters(1, false)}
          >
            <RotateCcw size={14} />
            <span>Retry Operation</span>
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="card directory-toolbar-card">
        <div className="directory-search-row">
          {/* Debounced Bilingual Search */}
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-control touch-search-input"
              placeholder={t('directory.search_placeholder', 'Search by voter name, Telugu name, house #, or serial...')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              aria-label="Search voters"
            />
            <Search
              size={18}
              className="search-input-icon"
            />
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

          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            className={`btn btn-secondary mobile-filter-toggle ${activeFiltersCount > 0 ? 'has-active-filters' : ''}`}
            onClick={() => setShowMobileFilters(prev => !prev)}
            aria-expanded={showMobileFilters}
          >
            <Filter size={16} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="filter-count-badge">{activeFiltersCount}</span>
            )}
          </button>
        </div>

        {/* Filter Controls (Responsive drawer / grid) */}
        <div className={`filter-controls-grid ${showMobileFilters ? 'mobile-visible' : ''}`}>
          {/* Roll Part Filter */}
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

          {/* Review Status Filter */}
          <div className="filter-item">
            <label className="filter-label">{t('directory.status_filter', 'Verification Status')}</label>
            <select
              className="form-control"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              aria-label="Filter by Status"
            >
              <option value="">{t('directory.all_statuses', 'All Statuses')}</option>
              <option value="approved">{t('directory.approved', 'Approved')}</option>
              <option value="needs_review">{t('directory.needs_review', 'Needs Review')}</option>
              <option value="flagged">{t('directory.flagged', 'Flagged')}</option>
            </select>
          </div>

          {/* Gender Filter */}
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

          {/* Reset Filters Action */}
          {activeFiltersCount > 0 && (
            <div className="filter-item filter-reset-item">
              <button
                type="button"
                className="btn btn-secondary btn-sm filter-reset-btn"
                onClick={() => {
                  setSelectedPart('');
                  setSelectedStatus('');
                  setSelectedGender('');
                  setShowMobileFilters(false);
                }}
              >
                <X size={14} />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Directory Records List / Table */}
      {loading ? (
        <SkeletonLoader type="voters" rows={8} />
      ) : (
        <>
          <VoterTable
            records={records}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAllPage={handleSelectAllPage}
            onViewDetails={(voter) => setActiveModalVoter(voter)}
            onToggleMark={handleToggleMark}
            canSelect={isLeader}
            canMark={isLeader}
            isLeader={isLeader}
          />

          {/* Infinite Scroll Sentinel & Load More Fallback */}
          <div className="infinite-scroll-container">
            {hasMore ? (
              <div className="infinite-scroll-status">
                <div ref={observerTarget} style={{ height: '20px' }} />
                {loadingMore ? (
                  <div className="loading-more-text">
                    <span className="spinner-dots">...</span> Loading more records...
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm load-more-btn"
                    onClick={() => fetchVoters(page + 1, true)}
                  >
                    {t('directory.load_more', 'Load More Records')} ({records.length} of {totalCount})
                  </button>
                )}
              </div>
            ) : (
              records.length > 0 && (
                <div className="records-end-text">
                  All {totalCount} matching records loaded from Supabase
                </div>
              )
            )}
          </div>
        </>
      )}

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <BulkActionToolbar
          selectedIds={selectedIds}
          constituencyId={constituencyId}
          onClearSelection={handleClearSelection}
          onActionComplete={handleBulkComplete}
        />
      )}

      {/* Voter Details Modal */}
      {activeModalVoter && (
        <VoterDetailModal
          voter={activeModalVoter}
          isOpen={Boolean(activeModalVoter)}
          onClose={() => setActiveModalVoter(null)}
          onUpdate={handleVoterUpdated}
          canEdit={isLeader}
        />
      )}
    </div>
  );
}
