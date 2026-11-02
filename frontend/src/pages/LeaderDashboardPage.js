import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { 
  Users, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw,
  PlusCircle,
  FileCheck2,
  ShieldCheck
} from 'lucide-react';
import { DashboardMetricsSkeleton } from '../components/common/SkeletonLoader.js';

export default function LeaderDashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [stats, setStats] = useState(() => {
    try {
      const saved = sessionStorage.getItem('ap_voters_leader_stats');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(!stats);
  const [error, setError] = useState(null);

  const isTelugu = i18n.language === 'te';

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getLeaderDashboardStats();
      if (res.success) {
        setStats(res.data);
        try {
          sessionStorage.setItem('ap_voters_leader_stats', JSON.stringify(res.data));
        } catch (e) {}
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch Leader dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const accessStatus = stats?.accessStatus || 'none';
  const constituency = stats?.constituency;

  return (
    <div className="leader-dashboard" style={{ paddingBottom: '3.5rem' }}>
      <div className="page-header-container">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-accent page-badge">LEADER WORKSPACE</span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Administrative Tracking</span>
          </div>
          <h1 className="page-title">
            {isTelugu ? 'నాయకుడి పరిపాలనా డాష్‌బోర్డ్' : 'Leader Administrative Dashboard'}
          </h1>
          <p className="page-subtitle">
            {isTelugu
              ? 'మీకు కేటాయించిన నియోజకవర్గ పరిధిలోని ఓటరు వివరాలు మరియు పరిపాలనా జాబితా.'
              : 'Real-time overview of your assigned constituency and tracked administrative voter roster.'}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchStats}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>{isTelugu ? 'తాజాకరించు' : 'Refresh'}</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Access Status Banner */}
      {loading ? (
        <div className="card" style={{
          padding: '1.25rem 1.5rem',
          borderRadius: '14px',
          marginBottom: '1.75rem',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div className="skeleton-box" style={{ width: '42px', height: '42px', borderRadius: '10px' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton-box" style={{ width: '130px', height: '14px', marginBottom: '8px' }} />
            <div className="skeleton-box" style={{ width: '220px', height: '22px' }} />
          </div>
        </div>
      ) : (
        <div className="card" style={{
          padding: '1.25rem 1.5rem',
          borderRadius: '14px',
          marginBottom: '1.75rem',
          background: accessStatus === 'approved' ? '#f0fdf4' : accessStatus === 'pending' ? '#fffbeb' : '#f8fafc',
          border: `1px solid ${accessStatus === 'approved' ? '#bbf7d0' : accessStatus === 'pending' ? '#fde68a' : '#e2e8f0'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: accessStatus === 'approved' ? '#16a34a' : accessStatus === 'pending' ? '#d97706' : '#64748b',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {accessStatus === 'approved' ? <CheckCircle2 size={22} /> : accessStatus === 'pending' ? <Clock size={22} /> : <AlertCircle size={22} />}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                {isTelugu ? 'అనుమతి స్థితి' : 'Access Authorization Status'}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                {accessStatus === 'approved' ? (
                  <span style={{ color: '#15803d' }}>
                    {isTelugu ? 'ఆమోదించబడింది (Active Approval)' : 'Approved & Active'}
                  </span>
                ) : accessStatus === 'pending' ? (
                  <span style={{ color: '#b45309' }}>
                    {isTelugu ? 'అడ్మిన్ ఆమోదం కోసం పెండింగ్‌లో ఉంది' : 'Pending Super Admin Review'}
                  </span>
                ) : (
                  <span style={{ color: '#64748b' }}>
                    {isTelugu ? 'అనుమతి కేటాయించబడలేదు' : 'No Active Assignment'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {accessStatus !== 'approved' && (
            <Link to="/leader/voters" className="btn btn-primary btn-sm">
              <span>{isTelugu ? 'నియోజకవర్గాన్ని ఎంచుకోండి / అభ్యర్థించండి' : 'Select / Request Access'}</span>
            </Link>
          )}
        </div>
      )}

      {/* Metrics Row */}
      {loading ? (
        <DashboardMetricsSkeleton count={3} />
      ) : (
        <div className="dashboard-stats-grid">
          {/* Active Constituency */}
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-header">
              <span className="dashboard-stat-title">
                {isTelugu ? 'ప్రస్తుత నియోజకవర్గం' : 'Assigned Constituency'}
              </span>
              <div className="dashboard-stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <MapPin size={18} />
              </div>
            </div>
            <div className="dashboard-stat-value" style={{ fontSize: '1.25rem' }}>
              {constituency ? (
                isTelugu && constituency.name_te ? constituency.name_te : constituency.name_en
              ) : (
                'Not Selected'
              )}
            </div>
            <div className="dashboard-stat-sub">
              {constituency ? `${constituency.assembly_name_en} • ${constituency.district_name_en}` : 'Please select from directory'}
            </div>
          </div>

          {/* Total Available Voters */}
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-header">
              <span className="dashboard-stat-title">
                {isTelugu ? 'మొత్తం ఓటర్లు' : 'Available Roll'}
              </span>
              <div className="dashboard-stat-icon-wrapper" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                <Users size={18} />
              </div>
            </div>
            <div className="dashboard-stat-value">
              {(stats?.totalAvailableVoters ?? 0).toLocaleString()}
            </div>
            <div className="dashboard-stat-sub">
              {isTelugu ? 'అధికారిక రికార్డులు' : 'In authorized scope'}
            </div>
          </div>

          {/* Total Added Voters */}
          <div className="dashboard-stat-card stat-span-2">
            <div className="dashboard-stat-header">
              <span className="dashboard-stat-title">
                {isTelugu ? 'నా జాబితాలోని ఓటర్లు' : 'Voters in My List'}
              </span>
              <div className="dashboard-stat-icon-wrapper" style={{ background: '#dcfce7', color: '#16a34a' }}>
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div>
              <div className="dashboard-stat-value" style={{ color: '#15803d' }}>
                {(stats?.totalAddedVoters ?? 0).toLocaleString()}
              </div>
              <div className="dashboard-stat-sub">
                <Link to="/leader/added-voters" style={{ color: '#15803d', textDecoration: 'none', fontWeight: 600 }}>
                  {isTelugu ? 'జాబితాను చూడండి →' : 'View Added Voters →'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Quick Links */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
        {isTelugu ? 'త్వరిత చర్యలు' : 'Leader Workflows'}
      </h2>

      <div className="dashboard-workflows-grid">
        <Link to="/leader/voters" className="dashboard-workflow-card">
          <div className="workflow-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <Users size={22} />
          </div>
          <div className="workflow-content">
            <div className="workflow-title">
              {isTelugu ? 'ఓటరు డైరెక్టరీ' : 'Voter Directory'}
            </div>
            <div className="workflow-desc">
              {isTelugu ? 'ఓటర్లను అడ్మిన్ జాబితాలోకి చేర్చండి' : 'Browse & add voters to your list'}
            </div>
          </div>
        </Link>

        <Link to="/leader/added-voters" className="dashboard-workflow-card">
          <div className="workflow-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="workflow-content">
            <div className="workflow-title">
              {isTelugu ? 'చేర్చబడిన ఓటర్లు' : 'My Added Voters'}
            </div>
            <div className="workflow-desc">
              {isTelugu ? 'పరిపాలనా జాబితా ట్రాకింగ్' : 'View private tracking list'}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
