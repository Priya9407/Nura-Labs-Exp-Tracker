import React, { useState, useEffect } from 'react';

const StatCard = ({
  title,
  value,
  icon: Icon,
  color = 'default',
  onClick,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getColors = () => {
    const colors = {
      default: { bg: 'var(--bg-surface-alt)', icon: 'var(--text-muted)' },
      teal: { bg: 'var(--accent-teal-light)', icon: 'var(--accent-teal)' },
      orange: { bg: 'var(--accent-orange-light)', icon: 'var(--accent-orange)' },
      blue: { bg: 'var(--info-light)', icon: 'var(--info)' },
      red: { bg: 'var(--error-light)', icon: 'var(--error)' },
    };
    return colors[color] || colors.default;
  };

  const scheme = getColors();

  const styles = {
    card: {
      background: 'var(--bg-surface)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      padding: isMobile ? '12px' : '16px 20px',
      cursor: onClick ? 'pointer' : 'default',
      display: 'flex',
      alignItems: isMobile ? 'flex-start' : 'center',
      gap: isMobile ? '10px' : '14px',
      transition: 'all 0.15s ease',
      minWidth: 0,
      flexDirection: isMobile ? 'column' : 'row',
    },
    iconWrapper: {
      width: isMobile ? '36px' : '44px',
      height: isMobile ? '36px' : '44px',
      borderRadius: '10px',
      background: scheme.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    icon: {
      width: isMobile ? '18px' : '22px',
      height: isMobile ? '18px' : '22px',
      color: color === 'red' ? 'var(--error)' : scheme.icon,
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      minWidth: 0,
      flex: 1,
    },
    value: {
      fontSize: isMobile ? '22px' : '26px',
      fontWeight: 700,
      color: color === 'red' ? 'var(--error)' : 'var(--text-primary)',
      lineHeight: 1,
    },
    title: {
      fontSize: isMobile ? '11px' : '12px',
      fontWeight: 500,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.03em',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  };

  return (
    <div
      onClick={onClick}
      style={styles.card}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {Icon && (
        <div style={styles.iconWrapper}>
          <Icon style={styles.icon} />
        </div>
      )}
      <div style={styles.content}>
        <div style={styles.value}>{value}</div>
        <div style={styles.title}>{title}</div>
      </div>
    </div>
  );
};

export default StatCard;
