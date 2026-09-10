import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FilterProvider } from './contexts/FilterContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));

// App Pages
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const AlertsConfig = lazy(() => import('./pages/AlertsConfig'));
const OverviewHub = lazy(() => import('./pages/OverviewHub'));
const SalesHub = lazy(() => import('./pages/SalesHub'));
const CustomerHub = lazy(() => import('./pages/CustomerHub'));
const OperationsHub = lazy(() => import('./pages/OperationsHub'));
const CatalogHub = lazy(() => import('./pages/CatalogHub'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Fallback loader component
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
    <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <FilterProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            <Route path="/" element={<Navigate to="/app" replace />} />

            <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<OverviewHub />} />
              <Route path="sales" element={<SalesHub />} />
              <Route path="customers" element={<CustomerHub />} />
              <Route path="operations" element={<OperationsHub />} />
              <Route path="catalog" element={<CatalogHub />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings/alerts" element={<ProtectedRoute allowedRoles={['ADMIN']}><AlertsConfig /></ProtectedRoute>} />
            </Route>
          </Routes>
          </Suspense>
        </BrowserRouter>
      </FilterProvider>
    </AuthProvider>
  );
}

export default App;
