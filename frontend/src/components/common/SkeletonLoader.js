import React from 'react';

/**
 * Basic horizontal bar skeleton block
 */
export function SkeletonBlock({ width = '100%', height = '1.25rem', style = {}, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius: '6px',
        ...style
      }}
    />
  );
}

/**
 * Exact-match skeleton for Dashboard Stats / Metrics boxes
 * Matches .dashboard-stats-grid and .dashboard-stat-card in Admin and Leader dashboards
 */
export function DashboardMetricsSkeleton({ count = 5 }) {
  return (
    <div className="dashboard-stats-grid" aria-busy="true" aria-label="Loading statistics...">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={`dashboard-stat-card ${i === 4 ? 'stat-span-2' : ''}`}
          style={{ minHeight: '110px' }}
        >
          <div className="dashboard-stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <SkeletonBlock width={`${50 + (i % 3) * 15}%`} height="14px" />
            <SkeletonBlock width="32px" height="32px" style={{ borderRadius: '8px', flexShrink: 0 }} />
          </div>
          <div style={{ marginBottom: '0.4rem' }}>
            <SkeletonBlock width={`${40 + (i % 2) * 20}%`} height="28px" style={{ borderRadius: '6px' }} />
          </div>
          <SkeletonBlock width={`${60 + (i % 3) * 10}%`} height="12px" />
        </div>
      ))}
    </div>
  );
}

/**
 * Exact-match skeleton for Voter Directory Table
 * Matches Commoner, Leader, and Admin voter directory tables
 */
export function VoterTableSkeleton({ rows = 8, isLeader = false, isAdmin = false }) {
  return (
    <div className="table-responsive" aria-busy="true" aria-label="Loading voter directory...">
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
            {isLeader && <th style={{ padding: '0.75rem', width: '80px', textAlign: 'center' }}><SkeletonBlock width="40px" height="14px" style={{ margin: '0 auto' }} /></th>}
            <th style={{ padding: '0.75rem', width: '70px' }}><SkeletonBlock width="45px" height="14px" /></th>
            <th style={{ padding: '0.75rem' }}><SkeletonBlock width="130px" height="14px" /></th>
            <th style={{ padding: '0.75rem' }}><SkeletonBlock width="100px" height="14px" /></th>
            <th style={{ padding: '0.75rem', width: '110px' }}><SkeletonBlock width="80px" height="14px" /></th>
            <th style={{ padding: '0.75rem', width: '85px' }}><SkeletonBlock width="60px" height="14px" /></th>
            <th style={{ padding: '0.75rem', width: '80px' }}><SkeletonBlock width="55px" height="14px" /></th>
            <th style={{ padding: '0.75rem', width: '65px' }}><SkeletonBlock width="40px" height="14px" /></th>
            <th style={{ padding: '0.75rem', width: '90px', textAlign: 'right' }}><SkeletonBlock width="60px" height="14px" style={{ marginLeft: 'auto' }} /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
              {isLeader && (
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <SkeletonBlock width="32px" height="32px" style={{ borderRadius: '8px', margin: '0 auto' }} />
                </td>
              )}
              {/* Sl No */}
              <td style={{ padding: '0.75rem' }}>
                <SkeletonBlock width="38px" height="20px" style={{ borderRadius: '4px' }} />
              </td>
              {/* Voter Name: Two lines for English and Telugu */}
              <td style={{ padding: '0.75rem' }}>
                <SkeletonBlock width={`${65 + (idx % 3) * 10}%`} height="15px" style={{ marginBottom: '5px' }} />
                <SkeletonBlock width={`${45 + (idx % 2) * 15}%`} height="12px" />
              </td>
              {/* Relative Name */}
              <td style={{ padding: '0.75rem' }}>
                <SkeletonBlock width={`${60 + (idx % 3) * 12}%`} height="14px" style={{ marginBottom: '4px' }} />
                <SkeletonBlock width="40%" height="11px" />
              </td>
              {/* EPIC */}
              <td style={{ padding: '0.75rem' }}>
                <SkeletonBlock width="85px" height="22px" style={{ borderRadius: '4px' }} />
              </td>
              {/* House No */}
              <td style={{ padding: '0.75rem' }}>
                <SkeletonBlock width="55px" height="14px" />
              </td>
              {/* Age / Gender */}
              <td style={{ padding: '0.75rem' }}>
                <SkeletonBlock width="65px" height="20px" style={{ borderRadius: '999px' }} />
              </td>
              {/* Part */}
              <td style={{ padding: '0.75rem' }}>
                <SkeletonBlock width="35px" height="14px" />
              </td>
              {/* Action Button */}
              <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                <SkeletonBlock width="68px" height="28px" style={{ borderRadius: '6px', marginLeft: 'auto' }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Exact-match skeleton for Mobile Voter Cards
 * Matches .voter-mobile-card in mobile views
 */
export function VoterCardsSkeleton({ count = 5 }) {
  return (
    <div className="mobile-cards-view" aria-busy="true" aria-label="Loading voter cards..." style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="card"
          style={{
            padding: '1.1rem',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            background: '#ffffff'
          }}
        >
          {/* Top badges */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <SkeletonBlock width="50px" height="22px" style={{ borderRadius: '6px' }} />
              <SkeletonBlock width="75px" height="22px" style={{ borderRadius: '6px' }} />
            </div>
            <SkeletonBlock width="32px" height="32px" style={{ borderRadius: '8px' }} />
          </div>

          {/* Names */}
          <div style={{ marginBottom: '0.85rem' }}>
            <SkeletonBlock width={`${65 + (i % 3) * 10}%`} height="18px" style={{ marginBottom: '6px' }} />
            <SkeletonBlock width={`${45 + (i % 2) * 15}%`} height="14px" />
          </div>

          {/* Meta details */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.75rem' }}>
            <SkeletonBlock width="90px" height="14px" />
            <SkeletonBlock width="70px" height="14px" />
            <SkeletonBlock width="80px" height="14px" />
          </div>

          {/* Action button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SkeletonBlock width="85px" height="32px" style={{ borderRadius: '6px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Exact-match skeleton for Voter Detail view (Admin & Leader Voter Detail)
 */
export function VoterDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading voter details..." style={{ paddingBottom: '2rem' }}>
      <SkeletonBlock width="110px" height="34px" style={{ borderRadius: '8px', marginBottom: '1.5rem' }} />

      {/* Main card */}
      <div className="card" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
          <SkeletonBlock width="72px" height="72px" style={{ borderRadius: '16px', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: '200px' }}>
            <SkeletonBlock width="60%" height="24px" style={{ marginBottom: '8px' }} />
            <SkeletonBlock width="40%" height="18px" style={{ marginBottom: '8px' }} />
            <SkeletonBlock width="120px" height="24px" style={{ borderRadius: '6px' }} />
          </div>
        </div>

        {/* 2-Column Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '10px' }}>
              <SkeletonBlock width="45%" height="12px" style={{ marginBottom: '6px' }} />
              <SkeletonBlock width="70%" height="16px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Exact-match skeleton for Access Requests Table (Admin Access Requests)
 */
export function AccessRequestsSkeleton({ rows = 5 }) {
  return (
    <div className="table-responsive" aria-busy="true" aria-label="Loading access requests...">
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
            <th style={{ padding: '0.75rem', width: '110px' }}><SkeletonBlock width="70px" height="14px" /></th>
            <th style={{ padding: '0.75rem' }}><SkeletonBlock width="120px" height="14px" /></th>
            <th style={{ padding: '0.75rem' }}><SkeletonBlock width="140px" height="14px" /></th>
            <th style={{ padding: '0.75rem', width: '90px' }}><SkeletonBlock width="60px" height="14px" /></th>
            <th style={{ padding: '0.75rem', width: '140px', textAlign: 'right' }}><SkeletonBlock width="80px" height="14px" style={{ marginLeft: 'auto' }} /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.75rem' }}><SkeletonBlock width="80px" height="14px" /></td>
              <td style={{ padding: '0.75rem' }}>
                <SkeletonBlock width="130px" height="15px" style={{ marginBottom: '4px' }} />
                <SkeletonBlock width="95px" height="12px" />
              </td>
              <td style={{ padding: '0.75rem' }}>
                <SkeletonBlock width="150px" height="14px" style={{ marginBottom: '4px' }} />
                <SkeletonBlock width="110px" height="11px" />
              </td>
              <td style={{ padding: '0.75rem' }}><SkeletonBlock width="70px" height="22px" style={{ borderRadius: '6px' }} /></td>
              <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                  <SkeletonBlock width="64px" height="28px" style={{ borderRadius: '6px' }} />
                  <SkeletonBlock width="64px" height="28px" style={{ borderRadius: '6px' }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Exact-match skeleton for Constituency Hierarchy Tree (Admin Constituencies)
 */
export function HierarchySkeleton({ count = 4 }) {
  return (
    <div aria-busy="true" aria-label="Loading constituency hierarchy..." style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1 }}>
            <SkeletonBlock width="36px" height="36px" style={{ borderRadius: '8px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <SkeletonBlock width={`${35 + (i % 2) * 15}%`} height="18px" style={{ marginBottom: '4px' }} />
              <SkeletonBlock width={`${20 + (i % 3) * 10}%`} height="12px" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <SkeletonBlock width="70px" height="24px" style={{ borderRadius: '6px' }} />
            <SkeletonBlock width="32px" height="32px" style={{ borderRadius: '6px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Exact-match skeleton for CSV Import History
 */
export function ImportHistorySkeleton({ rows = 5 }) {
  return (
    <div className="table-responsive" aria-busy="true" aria-label="Loading import history...">
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
            <th style={{ padding: '0.65rem' }}><SkeletonBlock width="90px" height="14px" /></th>
            <th style={{ padding: '0.65rem' }}><SkeletonBlock width="130px" height="14px" /></th>
            <th style={{ padding: '0.65rem' }}><SkeletonBlock width="110px" height="14px" /></th>
            <th style={{ padding: '0.65rem' }}><SkeletonBlock width="50px" height="14px" /></th>
            <th style={{ padding: '0.65rem' }}><SkeletonBlock width="55px" height="14px" /></th>
            <th style={{ padding: '0.65rem' }}><SkeletonBlock width="50px" height="14px" /></th>
            <th style={{ padding: '0.65rem' }}><SkeletonBlock width="70px" height="14px" /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.65rem' }}><SkeletonBlock width="100px" height="14px" /></td>
              <td style={{ padding: '0.65rem' }}><SkeletonBlock width="140px" height="14px" /></td>
              <td style={{ padding: '0.65rem' }}><SkeletonBlock width="120px" height="14px" /></td>
              <td style={{ padding: '0.65rem' }}><SkeletonBlock width="40px" height="14px" /></td>
              <td style={{ padding: '0.65rem' }}><SkeletonBlock width="45px" height="14px" /></td>
              <td style={{ padding: '0.65rem' }}><SkeletonBlock width="35px" height="14px" /></td>
              <td style={{ padding: '0.65rem' }}><SkeletonBlock width="65px" height="20px" style={{ borderRadius: '6px' }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Full Page Skeleton for ProtectedRoute or initial boot
 */
export function PageSkeleton() {
  return (
    <div style={{ width: '100%', padding: '1rem 0' }} aria-busy="true" aria-label="Loading page...">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <SkeletonBlock width="140px" height="18px" style={{ marginBottom: '8px' }} />
          <SkeletonBlock width="260px" height="28px" />
        </div>
        <SkeletonBlock width="90px" height="36px" style={{ borderRadius: '8px' }} />
      </div>
      <DashboardMetricsSkeleton count={4} />
      <div className="card" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', marginTop: '1.5rem' }}>
        <VoterTableSkeleton rows={5} />
      </div>
    </div>
  );
}

/**
 * Universal SkeletonLoader export
 */
export default function SkeletonLoader({ type = 'bars', rows = 6, height = '2.5rem', count = 5, isLeader = false, isAdmin = false }) {
  switch (type) {
    case 'voters':
    case 'voter-table':
      return <VoterTableSkeleton rows={rows} isLeader={isLeader} isAdmin={isAdmin} />;
    case 'voter-cards':
    case 'cards':
      return <VoterCardsSkeleton count={count || rows} />;
    case 'metrics':
    case 'dashboard':
      return <DashboardMetricsSkeleton count={count || 5} />;
    case 'detail':
    case 'voter-detail':
      return <VoterDetailSkeleton />;
    case 'requests':
    case 'access-requests':
      return <AccessRequestsSkeleton rows={rows} />;
    case 'hierarchy':
    case 'constituencies':
      return <HierarchySkeleton count={count || 4} />;
    case 'imports':
    case 'import-history':
      return <ImportHistorySkeleton rows={rows} />;
    case 'page':
    case 'app':
      return <PageSkeleton />;
    case 'bars':
    default:
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', padding: '0.5rem 0' }}>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonBlock
              key={i}
              height={height}
              width="100%"
              style={{ opacity: 1 - i * 0.08 }}
            />
          ))}
        </div>
      );
  }
}
