import React from 'react';

const AlertCircleIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);

const CheckCircleIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const InfoIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

const AlertTriangleIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

const XIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const alertConfig = {
  error: {
    icon: AlertCircleIcon,
    bg: 'var(--error-light)',
    border: 'var(--error)',
    text: 'var(--error)',
    iconColor: 'var(--error)',
    textOpacity: 1,
  },
  success: {
    icon: CheckCircleIcon,
    bg: 'var(--success-light)',
    border: 'var(--success)',
    text: 'var(--success)',
    iconColor: 'var(--success)',
    textOpacity: 1,
  },
  warning: {
    icon: AlertTriangleIcon,
    bg: 'var(--warning-light)',
    border: 'var(--warning)',
    text: 'var(--warning)',
    iconColor: 'var(--warning)',
    textOpacity: 1,
  },
  info: {
    icon: InfoIcon,
    bg: 'var(--info-light)',
    border: 'var(--info)',
    text: 'var(--info)',
    iconColor: 'var(--info)',
    textOpacity: 1,
  },
};

const AlertBanner = ({
  variant = 'info',
  title,
  children,
  onClose,
  style = {},
}) => {
  const config = alertConfig[variant];
  const Icon = config.icon;

  const containerStyles = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '12px',
    border: `1px solid ${config.border}`,
    background: config.bg,
    ...style,
  };

  const iconStyles = {
    width: '20px',
    height: '20px',
    flexShrink: 0,
    marginTop: '2px',
    color: config.iconColor,
  };

  const contentStyles = {
    flex: 1,
    minWidth: 0,
  };

  const titleStyles = {
    fontSize: '13px',
    fontWeight: 600,
    color: config.text,
    opacity: config.textOpacity || 1,
  };

  const textStyles = {
    fontSize: '13px',
    color: 'var(--text-primary)',
    opacity: title ? 0.85 : 1,
    marginTop: title ? '4px' : 0,
  };

  const closeButtonStyles = {
    flexShrink: 0,
    padding: '4px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    color: config.iconColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s ease',
  };

  return (
    <div style={containerStyles}>
      <Icon style={iconStyles} />
      <div style={contentStyles}>
        {title && <p style={titleStyles}>{title}</p>}
        {children && <div style={textStyles}>{children}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={closeButtonStyles}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <XIcon style={{ width: '16px', height: '16px' }} />
        </button>
      )}
    </div>
  );
};

export default AlertBanner;
