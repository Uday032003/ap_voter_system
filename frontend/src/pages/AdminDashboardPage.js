import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js';
import {
  Users,
  MapPin,
  Layers,
  UploadCloud,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { DashboardMetricsSkeleton, ImportHistorySkeleton } from '../components/common/SkeletonLoader.js';

export default function AdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isTelugu = i18n.language === 'te';

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAdminDashboardStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="admin-dashboard" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="page-header-container">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-danger page-badge">SUPER ADMIN</span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>AP State Control</span>
          </div>
          <h1 className="page-title">
            {isTelugu ? 'రాష్ట్ర నిర్వాహక డాష్‌బోర్డ్' : 'Super Admin Dashboard'}
          </h1>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchStats}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>{isTelugu ? 'తాజాకరించు' : 'Refresh Data'}</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      {loading ? (
        <DashboardMetricsSkeleton count={5} />
      ) : (
        <div className="dashboard-stats-grid">
          {/* Total Voters */}
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-header">
              <span className="dashboard-stat-title">
                {isTelugu ? 'మొత్తం ఓటర్లు' : 'Total Voters'}
              </span>
              <div className="dashboard-stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <Users size={18} />
              </div>
            </div>
            <div className="dashboard-stat-value">
              {(stats?.total_voters ?? 0).toLocaleString()}
            </div>
            <div className="dashboard-stat-sub" style={{ color: '#16a34a', fontWeight: 600 }}>
              ✓ {isTelugu ? 'ధృవీకరించబడిన డేటా' : 'Live Electoral Roll'}
            </div>
          </div>

          {/* Configured Districts */}
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-header">
              <span className="dashboard-stat-title">
                {isTelugu ? 'జిల్లాలు' : 'Configured Districts'}
              </span>
              <div className="dashboard-stat-icon-wrapper" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                <MapPin size={18} />
              </div>
            </div>
            <div className="dashboard-stat-value">
              {stats?.districts_count ?? 0}
            </div>
            <div className="dashboard-stat-sub">
              {isTelugu ? 'ఆంధ్రప్రదేశ్ పరిధిలో' : 'Active in AP'}
            </div>
          </div>

          {/* Assembly Constituencies */}
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-header">
              <span className="dashboard-stat-title">
                {isTelugu ? 'అసెంబ్లీ నియోజకవర్గాలు' : 'Assembly Areas'}
              </span>
              <div className="dashboard-stat-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Layers size={18} />
              </div>
            </div>
            <div className="dashboard-stat-value">
              {stats?.assemblies_count ?? 0}
            </div>
            <div className="dashboard-stat-sub">
              {isTelugu ? 'కాన్స్టిట్యూయెన్సీలు' : 'Assembly Constituencies'}
            </div>
          </div>

          {/* MPTC Village Constituencies */}
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-header">
              <span className="dashboard-stat-title">
                {isTelugu ? 'ఎం.పి.టి.సి నియోజకవర్గాలు' : 'MPTC Villages'}
              </span>
              <div className="dashboard-stat-icon-wrapper" style={{ background: '#dcfce7', color: '#16a34a' }}>
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="dashboard-stat-value">
              {stats?.mptcs_count ?? 0}
            </div>
            <div className="dashboard-stat-sub">
              {isTelugu ? 'గ్రామ పరిధులు' : 'Village Constituencies'}
            </div>
          </div>

          {/* Pending Requests - Spans 2 columns on mobile */}
          <div className="dashboard-stat-card stat-span-2">
            <div className="dashboard-stat-header">
              <span className="dashboard-stat-title">
                {isTelugu ? 'పెండింగ్ అభ్యర్థనలు' : 'Pending Requests'}
              </span>
              <div className="dashboard-stat-icon-wrapper" style={{ background: '#ffedd5', color: '#ea580c' }}>
                <UserCheck size={18} />
              </div>
            </div>
            <div>
              <div className="dashboard-stat-value" style={{ color: (stats?.pending_requests_count > 0 ? '#ea580c' : '#0f172a') }}>
                {stats?.pending_requests_count ?? 0}
              </div>
              <div className="dashboard-stat-sub">
                <Link to="/admin/access-requests" style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 600 }}>
                  {isTelugu ? 'సమీక్షించండి →' : 'Review Requests →'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Navigation Cards */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
        {isTelugu ? 'నిర్వాహక చర్యలు' : 'Administrative Workflows'}
      </h2>

      <div className="dashboard-workflows-grid">
        <Link to="/admin/constituencies" className="dashboard-workflow-card">
          <div className="workflow-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
            <Layers size={22} />
          </div>
          <div className="workflow-content">
            <div className="workflow-title">
              {isTelugu ? 'నియోజకవర్గాల నిర్వహణ' : 'Constituency Management'}
            </div>
            <div className="workflow-desc">
              {isTelugu ? 'జిల్లాలు, అసెంబ్లీ, ఎంపీటీసీలు' : 'Add / edit districts & areas'}
            </div>
          </div>
        </Link>

        <Link to="/admin/imports" className="dashboard-workflow-card">
          <div className="workflow-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <UploadCloud size={22} />
          </div>
          <div className="workflow-content">
            <div className="workflow-title">
              {isTelugu ? 'CSV ఓటరు జాబితా దిగుమతి' : 'Voter CSV Import'}
            </div>
            <div className="workflow-desc">
              {isTelugu ? 'ధృవీకరణ & నకలు నివారణ' : 'Validate & upload electoral roll'}
            </div>
          </div>
        </Link>

        <Link to="/admin/voters" className="dashboard-workflow-card">
          <div className="workflow-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <Users size={22} />
          </div>
          <div className="workflow-content">
            <div className="workflow-title">
              {isTelugu ? 'ఓటరు రికార్డుల సవరణ' : 'All Voters Directory'}
            </div>
            <div className="workflow-desc">
              {isTelugu ? 'శోధన, వివరాలు & మార్పులు' : 'Search & edit master roll'}
            </div>
          </div>
        </Link>

        <Link to="/admin/access-requests" className="dashboard-workflow-card">
          <div className="workflow-icon" style={{ background: '#ffedd5', color: '#ea580c' }}>
            <UserCheck size={22} />
          </div>
          <div className="workflow-content">
            <div className="workflow-title">
              {isTelugu ? 'నాయకుల అనుమతుల సమీక్ష' : 'Leader Access Requests'}
            </div>
            <div className="workflow-desc">
              {isTelugu ? 'ఆమోదం, తిరస్కరణ & రద్దు' : 'Approve, reject, or revoke'}
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Imports Table */}
      <div className="card" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {isTelugu ? 'ఇటీవలి దిగుమతులు' : 'Recent Electoral Roll Imports'}
          </h3>
          <Link to="/admin/imports" style={{ fontSize: '0.85rem', color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>
            {isTelugu ? 'అన్ని దిగుమతులు →' : 'View Import Console →'}
          </Link>
        </div>

        {loading ? (
          <ImportHistorySkeleton rows={3} />
        ) : stats?.recentImports && stats.recentImports.length > 0 ? (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem' }}>{isTelugu ? 'తేదీ' : 'Date'}</th>
                  <th style={{ padding: '0.65rem' }}>{isTelugu ? 'ఫైల్' : 'File'}</th>
                  <th style={{ padding: '0.65rem' }}>{isTelugu ? 'నియోజకవర్గం' : 'Constituency'}</th>
                  <th style={{ padding: '0.65rem' }}>{isTelugu ? 'చేర్చబడినవి' : 'Inserted'}</th>
                  <th style={{ padding: '0.65rem' }}>{isTelugu ? 'నకళ్ళు' : 'Skipped'}</th>
                  <th style={{ padding: '0.65rem' }}>{isTelugu ? 'స్థితి' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentImports.map((imp) => (
                  <tr key={imp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.65rem', color: '#64748b' }}>
                      {new Date(imp.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.65rem', fontWeight: 600 }}>{imp.file_name}</td>
                    <td style={{ padding: '0.65rem' }}>
                      {isTelugu && imp.constituency_name_te ? imp.constituency_name_te : (imp.constituency_name_en || 'Atmakuru MPTC')}
                    </td>
                    <td style={{ padding: '0.65rem', color: '#16a34a', fontWeight: 600 }}>
                      +{imp.inserted_count}
                    </td>
                    <td style={{ padding: '0.65rem', color: '#64748b' }}>
                      {imp.skipped_count}
                    </td>
                    <td style={{ padding: '0.65rem' }}>
                      <span className={`badge ${imp.status === 'completed' ? 'badge-primary' : 'badge-danger'}`}>
                        {imp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
            <UploadCloud size={32} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
            <p style={{ margin: 0 }}>{isTelugu ? 'ఇంకా ఎటువంటి దిగుమతులు నిర్వహించబడలేదు.' : 'No recent imports found. Use the CSV import tool to upload electoral rolls.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
