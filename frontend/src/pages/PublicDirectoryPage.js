import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js';
import { Search, Globe, Shield, MapPin, Building, Users } from 'lucide-react';
import SkeletonLoader from '../components/common/SkeletonLoader.js';

export default function PublicDirectoryPage() {
  const { t, i18n } = useTranslation();

  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Geographic selector state
  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('d1111111-0000-0000-0000-000000000001');
  const [selectedMandal, setSelectedMandal] = useState('m1111111-0000-0000-0000-000000000001');
  const [selectedConstituency, setSelectedConstituency] = useState('c1111111-0000-0000-0000-000000000001');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load geography filters
  useEffect(() => {
    async function loadGeography() {
      try {
        const [dRes, mRes, cRes] = await Promise.all([
          api.getDistricts(),
          api.getMandals(),
          api.getConstituencies()
        ]);
        if (dRes.success) setDistricts(dRes.data);
        if (mRes.success) setMandals(mRes.data);
        if (cRes.success) setConstituencies(cRes.data);
      } catch (err) {
        console.error('Failed to load geography:', err);
      }
    }
    loadGeography();
  }, []);

  // Fetch public approved voters
  const fetchPublicVoters = async (pageToFetch = 1) => {
    setLoading(true);
    try {
      const res = await api.getPublicVoters({
        constituencyId: selectedConstituency,
        search: debouncedSearch,
        page: pageToFetch,
        limit: 25
      });
      if (res.success) {
        setRecords(res.records);
        setTotalCount(res.totalCount);
        setHasMore(res.hasMore);
        setPage(pageToFetch);
      }
    } catch (err) {
      console.error('Failed to fetch public directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicVoters(1);
  }, [selectedConstituency, debouncedSearch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
        color: '#fff',
        padding: '2rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <Globe size={24} color="#a7f3d0" />
          <h1 style={{ color: '#fff', fontSize: '1.6rem' }}>{t('public.title')}</h1>
        </div>
        <p style={{ color: '#d1fae5', fontSize: '0.95rem', maxWidth: '780px', lineHeight: 1.6 }}>
          {t('public.subtitle')} — {t('public.disclaimer')}
        </p>
      </div>

      {/* Location Filter Cards */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h4 style={{ fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '0.85rem' }}>
          Select Location Hierarchy
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">District</label>
            <select
              className="form-control"
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
            >
              {districts.map(d => (
                <option key={d.id} value={d.id}>
                  {i18n.language === 'te' ? d.name_te : d.name_en}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Mandal</label>
            <select
              className="form-control"
              value={selectedMandal}
              onChange={e => setSelectedMandal(e.target.value)}
            >
              {mandals.map(m => (
                <option key={m.id} value={m.id}>
                  {i18n.language === 'te' ? m.name_te : m.name_en}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">MPTC Constituency</label>
            <select
              className="form-control"
              value={selectedConstituency}
              onChange={e => setSelectedConstituency(e.target.value)}
            >
              {constituencies.map(c => (
                <option key={c.id} value={c.id}>
                  {i18n.language === 'te' ? c.name_te : c.name_en}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginTop: '1rem', position: 'relative' }}>
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by name in English or Telugu, serial number, house number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </div>

      {/* Public Results Notice */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Showing <strong>{records.length}</strong> of <strong>{totalCount}</strong> verified public electors
        </span>
        <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Shield size={14} /> Lawfully Approved Public Subset
        </span>
      </div>

      {/* Public Table */}
      {loading ? (
        <SkeletonLoader type="voters" rows={6} />
      ) : records.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <Users size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>No public records found matching this inquiry.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>Serial</th>
                <th>Name in English</th>
                <th>Name in Telugu</th>
                <th>Relation</th>
                <th>House No</th>
                <th>Age / Gender</th>
                <th>Polling Booth / Part</th>
              </tr>
            </thead>
            <tbody>
              {records.map(voter => (
                <tr key={voter.id}>
                  <td><strong>#{voter.serial_number}</strong></td>
                  <td style={{ fontWeight: 600, color: 'var(--secondary)' }}>{voter.name_en}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{voter.name_te}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {voter.relative_name_en} ({voter.relative_type})
                  </td>
                  <td>{voter.house_number_en}</td>
                  <td>{voter.age} Yrs • {voter.gender}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    <strong>Part {voter.part_number}:</strong> {i18n.language === 'te' ? voter.part_name_te : voter.part_name_en}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalCount > 25 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fetchPublicVoters(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Page {page} of {Math.ceil(totalCount / 25)}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fetchPublicVoters(page + 1)}
            disabled={!hasMore}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
