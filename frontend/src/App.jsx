import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { checkAuth } from './api/auth';
import LoginPage from './pages/Login';
import ActivatePage from './pages/Activate';
import DashboardPage from './pages/Dashboard';
import ExperimentDetailPage from './pages/ExperimentDetail';
import ExperimentsPage from './pages/Experiments';
import TeamPage from './pages/Team';
import ProfilePage from './pages/Profile';
import AppLayout from './components/layout/AppLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './styles/global.css';

// Loading Spinner Component
const LoadingSpinner = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-page)',
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        border: '2px solid var(--accent-coral)',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading...</p>
    </div>
  </div>
);

// Inner app component that has access to auth context
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/activate" element={<ActivatePage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/experiments" element={<ExperimentsPage />} />
        <Route path="/experiment/:uuid" element={<ExperimentDetailPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
    </Routes>
  );
}

function App() {
  const [loading, setLoading] = useState(true);
  const [initialUser, setInitialUser] = useState(null);

  useEffect(() => {
    checkAuth().then(userData => {
      setInitialUser(userData);
      setLoading(false);
    }).catch(() => {
      setInitialUser(null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ThemeProvider>
      <AuthProvider initialUser={initialUser}>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
