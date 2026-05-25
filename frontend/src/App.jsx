import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { checkAuth } from './api/auth';
import LoginPage from './pages/Login';
import ActivatePage from './pages/Activate';
import DashboardPage from './pages/Dashboard';
import ExperimentDetailPage from './pages/ExperimentDetail';
import ArchivedPage from './pages/Archived';
import Layout from './components/Layout';
import { AuthProvider } from './context/AuthContext';

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth().then(userData => {
      setUser(userData);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // Protected route wrapper
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Public route wrapper (redirects to dashboard if already logged in)
  const PublicRoute = ({ children }) => {
    if (user) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <AuthProvider initialUser={user}>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/activate" element={<ActivatePage />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/experiment/:uuid" element={<ExperimentDetailPage />} />
          <Route path="/archived" element={<ArchivedPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
