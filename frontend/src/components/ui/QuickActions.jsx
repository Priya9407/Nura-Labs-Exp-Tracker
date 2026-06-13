import React, { useState, useRef, useEffect } from 'react';

const MoreIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

const QuickActions = ({ actions = [], primaryAction, label = "Actions" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (actions.length === 0 && !primaryAction) return null;

  const styles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    primaryBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 18px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: 600,
      color: 'white',
      background: 'var(--accent-coral)',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
    dropdownBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      border: '1px solid var(--border)',
      background: 'var(--bg-surface)',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
    dropdownMenu: {
      position: 'absolute',
      top: '100%',
      right: 0,
      marginTop: '8px',
      minWidth: '200px',
      background: 'var(--bg-surface)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-modal)',
      zIndex: 100,
      opacity: isOpen ? 1 : 0,
      transform: isOpen ? 'translateY(0)' : 'translateY(-8px)',
      pointerEvents: isOpen ? 'auto' : 'none',
      transition: 'all 0.2s ease',
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      width: '100%',
      padding: '12px 16px',
      fontSize: '14px',
      color: 'var(--text-primary)',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.15s ease',
    },
    menuItemDanger: {
      color: 'var(--error)',
    },
    divider: {
      height: '1px',
      background: 'var(--border)',
      margin: '4px 0',
    },
  };

  const primaryActions = actions.filter(a => a.variant === 'primary' || a.isPrimary);
  const secondaryActions = actions.filter(a => a.variant !== 'primary' && a.variant !== 'danger' && !a.isPrimary);
  const dangerActions = actions.filter(a => a.variant === 'danger');

  return (
    <div style={styles.container} ref={dropdownRef}>
      {primaryAction && (
        <button
          style={styles.primaryBtn}
          onClick={primaryAction.onClick}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-coral-hover)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--accent-coral)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {primaryAction.icon && (
            <span style={{ display: 'flex' }}>{primaryAction.icon}</span>
          )}
          {primaryAction.label}
        </button>
      )}

      {actions.length > 0 && (
        <div style={{ position: 'relative' }}>
          <button
            style={styles.dropdownBtn}
            onClick={() => setIsOpen(!isOpen)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-highlight)';
              e.currentTarget.style.borderColor = 'var(--accent-coral)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-surface)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
            aria-label={label}
          >
            <MoreIcon style={{ width: '18px', height: '18px', color: 'var(--text-secondary)' }} />
          </button>

          <div style={styles.dropdownMenu}>
            {secondaryActions.map((action, index) => (
              <button
                key={index}
                style={styles.menuItem}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-highlight)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {action.icon && (
                  <span style={{ display: 'flex', color: 'var(--text-muted)' }}>
                    {action.icon}
                  </span>
                )}
                {action.label}
              </button>
            ))}

            {dangerActions.length > 0 && secondaryActions.length > 0 && (
              <div style={styles.divider} />
            )}

            {dangerActions.map((action, index) => (
              <button
                key={`danger-${index}`}
                style={{ ...styles.menuItem, ...styles.menuItemDanger }}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--error-light)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {action.icon && (
                  <span style={{ display: 'flex' }}>{action.icon}</span>
                )}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickActions;
