import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';

// SVG Icons
const SearchIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const PlusIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const BellIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

const ChevronDownIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const UserIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const UsersIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const HelpIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
  </svg>
);

const LogoutIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const SearchIconSmall = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

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

const Navbar = ({ user, isMobile, onMenuClick, isMenuOpen }) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.reload();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Responsive header styles - hidden on desktop
  const headerStyles = {
    height: isMobile ? '64px' : '72px',
    margin: isMobile ? '12px 12px 0 12px' : '24px 24px 0 0',
    background: 'var(--bg-sidebar)',
    borderRadius: isMobile ? '12px' : '16px',
    boxShadow: 'var(--shadow-sidebar)',
    border: '1px solid var(--border)',
    position: 'sticky',
    top: isMobile ? '0' : '16px',
    zIndex: 30,
    transition: 'all 0.3s ease',
    minWidth: 0, // Prevent overflow
    display: isMobile ? 'block' : 'none', // Hidden on desktop
  };

  const containerStyles = {
    height: '100%',
    padding: isMobile ? '0 12px' : '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: isMobile ? '8px' : '16px',
    minWidth: 0, // Prevent overflow
  };

  const leftStyles = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    minWidth: 0,
    width: '100%',
  };

  const logoStyles = {
    fontSize: isMobile ? '18px' : '22px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    fontFamily: "'Inter', sans-serif",
    whiteSpace: 'nowrap',
    letterSpacing: '-0.5px',
  };

  const logoAccentStyles = {
    color: 'var(--accent-coral)',
  };

  const rightStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '6px' : '16px',
    flexShrink: 0, // Prevent shrinking
  };

  const createButtonStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: isMobile ? '10px 14px' : '12px 20px',
    background: 'var(--accent-coral)',
    color: 'white',
    fontSize: isMobile ? '12px' : '14px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 4px 14px rgba(232, 89, 60, 0.25)',
    whiteSpace: 'nowrap',
  };

  const iconButtonStyles = {
    position: 'relative',
    padding: isMobile ? '8px' : '12px',
    background: 'transparent',
    border: 'none',
    borderRadius: isMobile ? '10px' : '12px',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  };

  const notificationDotStyles = {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '8px',
    height: '8px',
    background: 'var(--accent-orange)',
    borderRadius: '50%',
    border: '2px solid var(--bg-sidebar)',
  };

  const userButtonStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  };

  const userNameStyles = {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    display: isMobile ? 'none' : 'block',
  };

  const dropdownStyles = {
    position: 'fixed',
    right: isMobile ? '12px' : '24px',
    top: isMobile ? '76px' : '84px',
    width: isMobile ? 'calc(100vw - 24px)' : '280px',
    maxWidth: isMobile ? '320px' : '280px',
    background: 'var(--bg-surface)',
    borderRadius: isMobile ? '12px' : '16px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-modal)',
    zIndex: 100,
    overflow: 'hidden',
  };

  const dropdownHeaderStyles = {
    padding: '20px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-surface-alt)',
  };

  const dropdownNameStyles = {
    fontWeight: 700,
    fontSize: '16px',
    color: 'var(--text-primary)',
  };

  const dropdownEmailStyles = {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginTop: '4px',
  };

  const roleBadgeStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    marginTop: '10px',
    fontSize: '11px',
    fontWeight: 600,
    background: 'var(--accent-teal-light)',
    color: 'var(--accent-teal)',
    borderRadius: '20px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const menuItemStyles = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 16px',
    fontSize: '14px',
    color: 'var(--text-secondary)',
    background: 'transparent',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const dividerStyles = {
    height: '1px',
    background: 'var(--border)',
    margin: '8px 16px',
  };

  const logoutStyles = {
    ...menuItemStyles,
    color: 'var(--accent-coral)',
  };

  return (
    <header style={headerStyles}>
      <div style={containerStyles}>
        {/* Left: Menu (mobile) / Logo */}
        <div style={leftStyles}>
          {isMobile && (
            <button
              onClick={onMenuClick}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--bg-surface-alt)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-highlight)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-surface-alt)';
              }}
            >
              {isMenuOpen ? (
                <XIcon style={{ width: '20px', height: '20px' }} />
              ) : (
                <MenuIcon style={{ width: '20px', height: '20px' }} />
              )}
            </button>
          )}
          {/* Logo */}
          <span style={logoStyles}>
            Nura Labs
          </span>
        </div>

        {/* Right: Actions + Profile - Desktop */}
        {!isMobile && (
          <div style={rightStyles}>
            <button
              onClick={() => navigate('/experiments?create=true')}
              style={createButtonStyles}
              onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
            >
              <PlusIcon style={{ width: '18px', height: '18px' }} />
              <span>New Experiment</span>
            </button>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={userButtonStyles}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-highlight)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Avatar name={user?.name || 'User'} size="medium" />
                <span style={userNameStyles}>{user?.name?.split(' ')[0]}</span>
                <ChevronDownIcon style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />
              </button>

              {showUserMenu && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div style={dropdownStyles}>
                    <div style={dropdownHeaderStyles}>
                      <p style={dropdownNameStyles}>{user?.name}</p>
                      <p style={dropdownEmailStyles}>{user?.email}</p>
                      <span style={roleBadgeStyles}>{user?.role}</span>
                    </div>

                    <div style={{ padding: '12px' }}>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/profile');
                        }}
                        style={menuItemStyles}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-highlight)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <UserIcon style={{ width: '18px', height: '18px', color: 'var(--text-muted)' }} />
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/team');
                        }}
                        style={menuItemStyles}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-highlight)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <UsersIcon style={{ width: '18px', height: '18px', color: 'var(--text-muted)' }} />
                        Team
                      </button>
                      <button
                        onClick={() => setShowUserMenu(false)}
                        style={menuItemStyles}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-highlight)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <HelpIcon style={{ width: '18px', height: '18px', color: 'var(--text-muted)' }} />
                        Help & Support
                      </button>
                      <div style={dividerStyles} />
                      <button
                        onClick={handleLogout}
                        style={logoutStyles}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--error-light)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <LogoutIcon style={{ width: '18px', height: '18px' }} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Mobile: Search + New Experiment Icons */}
        {isMobile && (
          <div style={rightStyles}>
            {/* <button
              onClick={() => navigate('/experiments')}
              style={{
                ...iconButtonStyles,
                minWidth: '44px',
                minHeight: '44px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-highlight)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
              aria-label="Search experiments"
            >
              <SearchIconSmall style={{ width: '20px', height: '20px' }} />
            </button> */}

            <button
              onClick={() => navigate('/experiments?create=true')}
              style={{
                ...iconButtonStyles,
                background: 'var(--accent-coral)',
                color: 'white',
                borderRadius: '10px',
                minWidth: '44px',
                minHeight: '44px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'none';
              }}
              aria-label="Create new experiment"
            >
              <PlusIcon style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
