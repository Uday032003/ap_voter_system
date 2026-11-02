import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.js';

import Header from './components/common/Header.js';
import Footer from './components/common/Footer.js';
import ToastContainer from './components/common/Toast.js';
import MobileBottomNav from './components/common/MobileBottomNav.js';
import SkeletonLoader from './components/common/SkeletonLoader.js';

// Public Pages
import HomePage from './pages/HomePage.js';
import LoginPage from './pages/LoginPage.js';
import RegisterPage from './pages/RegisterPage.js';
import UnauthorizedPage from './pages/UnauthorizedPage.js';

// Super Admin Pages
import AdminDashboardPage from './pages/AdminDashboardPage.js';
import AdminConstituenciesPage from './pages/AdminConstituenciesPage.js';
import AdminVotersPage from './pages/AdminVotersPage.js';
import AdminVoterDetailPage from './pages/AdminVoterDetailPage.js';
import AdminImportsPage from './pages/AdminImportsPage.js';
import AdminAccessRequestsPage from './pages/AdminAccessRequestsPage.js';

// Leader Pages
import LeaderDashboardPage from './pages/LeaderDashboardPage.js';
import LeaderVotersPage from './pages/LeaderVotersPage.js';
import LeaderAddedVotersPage from './pages/LeaderAddedVotersPage.js';
import LeaderVoterDetailPage from './pages/LeaderVoterDetailPage.js';

// Commoner Pages
import CommonerVotersPage from './pages/CommonerVotersPage.js';

// Shared Settings Page
import SettingsPage from './pages/SettingsPage.js';

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <SkeletonLoader type="page" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default function App() {
  const { user } = useAuth();

  // Root redirect for authenticated users who visit /
  const getRoleDefaultPath = () => {
    if (!user) return null;
    if (user.role === 'super_admin') return '/admin/dashboard';
    if (user.role === 'leader') return '/leader/dashboard';
    return '/commoner/voters';
  };

  return (
    <>
      <Header />
      <ToastContainer />

      <main className="main-content">
        <div className="container">
          <Routes>
            {/* 1. Public Routes */}
            <Route path="/" element={user ? <Navigate to={getRoleDefaultPath()} replace /> : <HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sign-in" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/sign-up" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* 2. Super Admin Protected Routes */}
            <Route
              path="/admin"
              element={<Navigate to="/admin/dashboard" replace />}
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/constituencies"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <AdminConstituenciesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/voters"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <AdminVotersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/voters/:voterId"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <AdminVoterDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/imports"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <AdminImportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/access-requests"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <AdminAccessRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* 3. Leader Protected Routes */}
            <Route
              path="/leader"
              element={<Navigate to="/leader/dashboard" replace />}
            />
            <Route
              path="/leader/dashboard"
              element={
                <ProtectedRoute allowedRoles={['leader', 'super_admin']}>
                  <LeaderDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leader/voters"
              element={
                <ProtectedRoute allowedRoles={['leader', 'super_admin']}>
                  <LeaderVotersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leader/added-voters"
              element={
                <ProtectedRoute allowedRoles={['leader', 'super_admin']}>
                  <LeaderAddedVotersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leader/voters/:voterId"
              element={
                <ProtectedRoute allowedRoles={['leader', 'super_admin']}>
                  <LeaderVoterDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leader/settings"
              element={
                <ProtectedRoute allowedRoles={['leader', 'super_admin']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* 4. Commoner Protected Routes */}
            <Route
              path="/commoner"
              element={<Navigate to="/commoner/voters" replace />}
            />
            <Route
              path="/commoner/voters"
              element={
                <ProtectedRoute allowedRoles={['commoner', 'leader', 'super_admin']}>
                  <CommonerVotersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/commoner/settings"
              element={
                <ProtectedRoute allowedRoles={['commoner', 'leader', 'super_admin']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Backward compatibility aliases */}
            <Route path="/directory" element={<Navigate to={user?.role === 'leader' ? '/leader/voters' : user?.role === 'super_admin' ? '/admin/voters' : '/commoner/voters'} replace />} />
            <Route path="/workspace" element={<Navigate to="/leader/added-voters" replace />} />
            <Route path="/public-directory" element={<Navigate to="/commoner/voters" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </>
  );
}
