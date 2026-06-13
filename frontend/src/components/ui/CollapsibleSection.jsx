import React, { useState } from 'react';

const ChevronDownIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 9l-7 7-7-7" />
  </svg>
);

const CollapsibleSection = ({
  title,
  children,
  defaultExpanded = false,
  badge,
  icon: Icon,
  action,
  actionLabel,
  variant = 'default'
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const styles = {
    container: {
      background: 'var(--bg-surface)',
      borderRadius: '16px',
      border: '1px solid var(--border)',
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 20px',
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'background 0.15s ease',
    },
    headerHover: {
      background: 'var(--bg-highlight)',
    },
    iconWrapper: {
      width: '36px',
      height: '36px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: variant === 'primary' ? 'var(--accent-coral-light)' : 'var(--bg-surface-alt)',
    },
    title: {
      fontSize: '15px',
      fontWeight: 600,
      color: 'var(--text-primary)',
      flex: 1,
    },
    badge: {
      padding: '4px 10px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 600,
      background: 'var(--accent-coral)',
      color: 'white',
    },
    action: {
      padding: '6px 12px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: 500,
      color: 'var(--accent-coral)',
      background: 'var(--accent-coral-light)',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
    chevron: {
      width: '20px',
      height: '20px',
      color: 'var(--text-muted)',
      transition: 'transform 0.2s ease',
      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
    },
    content: {
      padding: isExpanded ? '0 20px 20px' : '0 20px',
      maxHeight: isExpanded ? '2000px' : '0',
      opacity: isExpanded ? 1 : 0,
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    },
    divider: {
      height: '1px',
      background: 'var(--border)',
      margin: '0 20px',
      opacity: isExpanded ? 1 : 0,
      transition: 'opacity 0.2s ease',
    },
  };

  return (
    <div style={styles.container}>
      <div
        style={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={(e) => {
          if (!isExpanded) e.currentTarget.style.background = 'var(--bg-highlight)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        {Icon && (
          <div style={styles.iconWrapper}>
            <Icon style={{
              width: '18px',
              height: '18px',
              color: variant === 'primary' ? 'var(--accent-coral)' : 'var(--text-secondary)'
            }} />
          </div>
        )}
        <span style={styles.title}>{title}</span>
        {badge && <span style={styles.badge}>{badge}</span>}
        {action && actionLabel && (
          <button
            style={styles.action}
            onClick={(e) => {
              e.stopPropagation();
              action();
            }}
          >
            {actionLabel}
          </button>
        )}
        <ChevronDownIcon style={styles.chevron} />
      </div>
      <div style={styles.divider} />
      <div style={styles.content}>
        {children}
      </div>
    </div>
  );
};

export default CollapsibleSection;
