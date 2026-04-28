import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';

import Login         from './pages/Login';
import Dashboard     from './pages/Dashboard';
import Assets        from './pages/Assets';
import RegisterAsset from './pages/RegisterAsset';
import Violations    from './pages/Violations';
import DMCA          from './pages/DMCA';

/* ── Protected route wrapper ── */
function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <LoadingSpinner label="Loading Guardian AI..." />
      </div>
    );
  }
  return user ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Login />} />

          {/* Protected */}
          <Route path="/dashboard"      element={<Protected><Dashboard /></Protected>} />
          <Route path="/assets"         element={<Protected><Assets /></Protected>} />
          <Route path="/assets/register" element={<Protected><RegisterAsset /></Protected>} />
          <Route path="/violations"     element={<Protected><Violations /></Protected>} />
          <Route path="/dmca"           element={<Protected><DMCA /></Protected>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
