import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

// SVG Icons
const MenuIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12h18M3 6h18M3 18h18" />
  </svg>
);

const XIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const DashboardIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const FlaskIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 3L7 17a2 2 0 002 2h6a2 2 0 002-2L15 3" />
    <path d="M6 3h12" />
  </svg>
);

const TeamIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const ProfileIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SunIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const MoonIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

const LogoutIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const MobileSidebar = ({ isOpen, onClose }) => {
  
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.reload();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const navItems = [
    { path: '/', icon: DashboardIcon, label: 'Dashboard' },
    { path: '/experiments', icon: FlaskIcon, label: 'Experiments' },
    { path: '/team', icon: TeamIcon, label: 'Team' },
    { path: '/profile', icon: ProfileIcon, label: 'Profile' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Close on route change
  useEffect(() => {
    if (isOpen) onClose();
  }, [location.pathname]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const buttonStyles = {
    position: 'fixed',
    top: '12px',
    left: '12px',
    zIndex: 60,
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'var(--bg-sidebar)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-card)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    transition: 'all 0.2s ease',
  };

  const overlayStyles = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 70,
    opacity: isOpen ? 1 : 0,
    visibility: isOpen ? 'visible' : 'hidden',
    transition: 'all 0.3s ease',
  };

  const sidebarStyles = {
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    width: '280px',
    background: 'var(--bg-sidebar)',
    zIndex: 80,
    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.3s ease',
    boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
  };

  const headerStyles = {
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    borderBottom: '1px solid var(--border)',
    justifyContent: 'space-between',
  };

  const logoStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const logoIconStyles = {
    width: '36px',
    height: '36px',
    background: 'var(--accent-coral)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const logoTextStyles = {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  };

  const navStyles = {
    flex: 1,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const getNavItemStyles = (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: active ? 600 : 500,
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    background: active ? 'var(--bg-highlight)' : 'transparent',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  });

  const bottomStyles = {
    padding: '16px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const buttonBaseStyles = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const activeDotStyles = {
    width: '6px',
    height: '6px',
    background: 'var(--accent-coral)',
    borderRadius: '50%',
    marginLeft: 'auto',
  };

  return (
    <>
      {/* Menu Button
      <button
        style={buttonStyles}
        onClick={() => {}}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-highlight)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--bg-surface)';
        }}
      >
        <MenuIcon style={{ width: '20px', height: '20px' }} />
      </button> */}

      {/* Overlay */}
      <div
        style={overlayStyles}
        onClick={() => onClose()}
      />

      {/* Sidebar */}
      <aside style={sidebarStyles}>
        {/* Header */}
        <div style={headerStyles}>
          <div style={logoStyles}>
            <div style={logoIconStyles}>
              <FlaskIcon style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <span style={logoTextStyles}>Nura Labs</span>
          </div>
          <button
            onClick={() => onClose()}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <XIcon style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={navStyles}>
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={getNavItemStyles(active)}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'var(--bg-highlight)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                <item.icon
                  style={{
                    width: '20px',
                    height: '20px',
                    color: active ? 'var(--accent-coral)' : 'var(--text-muted)',
                  }}
                />
                <span style={{ flex: 1 }}>{item.label}</span>
                {active && <div style={activeDotStyles} />}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div style={bottomStyles}>
          <button
            onClick={toggleTheme}
            style={buttonBaseStyles}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-highlight)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {theme === 'dark' ? (
              <SunIcon style={{ width: '18px', height: '18px' }} />
            ) : (
              <MoonIcon style={{ width: '18px', height: '18px' }} />
            )}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            onClick={handleLogout}
            style={buttonBaseStyles}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--error-light)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <LogoutIcon style={{ width: '18px', height: '18px', color: 'var(--text-muted)' }} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default MobileSidebar;
