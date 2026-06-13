import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

// SVG Icons
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

const PlusIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 5v14M5 12h14" />
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

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

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

  // Styles
  const sidebarStyles = {
    position: 'fixed',
    left: '16px',
    top: '16px',
    bottom: '16px',
    zIndex: 50,
    background: 'var(--bg-sidebar)',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-sidebar)',
    width: '200px',
    display: 'flex',
    flexDirection: 'column',
  };

  const logoStyles = {
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    borderBottom: '1px solid var(--border)',
  };

  const logoInnerStyles = {
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
    letterSpacing: '-0.01em',
  };

  const navStyles = {
    flex: 1,
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const getNavItemStyles = (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: active ? 600 : 500,
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    background: active ? 'var(--bg-highlight)' : 'transparent',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  });

  const bottomStyles = {
    padding: '12px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const buttonStyles = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const iconStyles = {
    width: '18px',
    height: '18px',
  };

  const activeDotStyles = {
    width: '6px',
    height: '6px',
    background: 'var(--accent-coral)',
    borderRadius: '50%',
    marginLeft: 'auto',
  };

  return (
    <aside style={sidebarStyles}>
      {/* Logo */}
      <div style={logoStyles}>
        <div style={logoInnerStyles}>
          <div style={logoIconStyles}>
            <FlaskIcon style={{ width: '20px', height: '20px', color: 'white' }} />
          </div>
          <span style={logoTextStyles}>Nura Labs</span>
        </div>
      </div>

      
       {/* Navigation */}
      <nav style={navStyles}>
        {/* New Experiment Button */}
        <button
          onClick={() => navigate('/experiments?create=true')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 12px',
            marginBottom: '12px',
            background: 'var(--accent-coral)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
        >
          <PlusIcon style={{ width: '16px', height: '16px' }} />
          New Experiment
        </button>

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
                  ...iconStyles,
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
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={buttonStyles}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-highlight)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          {theme === 'dark' ? (
            <SunIcon style={iconStyles} />
          ) : (
            <MoonIcon style={iconStyles} />
          )}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={buttonStyles}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-highlight)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <LogoutIcon style={{ ...iconStyles, color: 'var(--text-muted)' }} />
          <span>Logout</span>
        </button>

      </div>


    </aside>
  );
};

export default Sidebar;
