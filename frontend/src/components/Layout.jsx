import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="#3B82F6"/>
              <path d="M24 8L30 20H18L24 8Z" fill="white"/>
              <circle cx="24" cy="30" r="8" fill="white" fillOpacity="0.2"/>
              <circle cx="24" cy="30" r="4" fill="white"/>
            </svg>
            Nura AI Labs
          </Link>

          <div className="navbar-nav">
            <Link
              to="/"
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              to="/archived"
              className={`nav-link ${location.pathname === '/archived' ? 'active' : ''}`}
            >
              Archived
            </Link>
            <div className="nav-user">
              <span>{user?.name}</span>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
