import React from 'react';

const ProgressBar = ({
  progress,
  size = 'medium',
  variant = 'primary',
  showLabel = false,
  label,
  animated = true,
  striped = false,
  style = {},
}) => {
  const clampedProgress = Math.min(Math.max(progress || 0, 0), 100);

  const sizeStyles = {
    small: { height: '6px' },
    medium: { height: '10px' },
    large: { height: '16px' },
  };

  const variantColors = {
    primary: 'linear-gradient(90deg, var(--accent-teal) 0%, var(--accent-teal-hover) 100%)',
    success: 'linear-gradient(90deg, var(--success) 0%, var(--accent-teal-hover) 100%)',
    warning: 'linear-gradient(90deg, var(--accent-orange) 0%, var(--warning) 100%)',
    danger: 'linear-gradient(90deg, var(--error) 0%, var(--accent-coral-hover) 100%)',
    info: 'linear-gradient(90deg, var(--info) 0%, #60A5FA 100%)',
    gray: 'linear-gradient(90deg, var(--text-muted) 0%, var(--text-secondary) 100%)',
  };

  const containerStyles = {
    width: '100%',
    ...style,
  };

  const labelContainerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    marginBottom: '8px',
  };

  const labelTextStyles = {
    fontWeight: 500,
    color: 'var(--text-secondary)',
  };

  const percentageStyles = {
    fontWeight: 600,
    color: variant === 'danger' ? 'var(--error)' : 'var(--accent-teal)',
  };

  const trackStyles = {
    width: '100%',
    background: 'var(--bg-surface-alt)',
    borderRadius: '9999px',
    overflow: 'hidden',
    ...sizeStyles[size],
  };

  const fillStyles = {
    height: '100%',
    background: variantColors[variant] || variantColors.primary,
    borderRadius: '9999px',
    width: `${clampedProgress}%`,
    transition: animated ? 'width 0.5s ease-out' : 'none',
    position: 'relative',
  };

  const shimmerStyles = {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
    opacity: 0.5,
  };

  const stripedStyles = striped ? {
    backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
    backgroundSize: '20px 20px',
    animation: 'progress-stripes 1s linear infinite',
  } : {};

  return (
    <div style={containerStyles}>
      {(showLabel || label) && (
        <div style={labelContainerStyles}>
          {label && <span style={labelTextStyles}>{label}</span>}
          {showLabel && <span style={percentageStyles}>{Math.round(clampedProgress)}%</span>}
        </div>
      )}
      <div style={trackStyles}>
        <div style={{ ...fillStyles, ...stripedStyles }}>
          <div style={shimmerStyles} />
        </div>
      </div>
      <style>{`
        @keyframes progress-stripes {
          0% { background-position: 0 0; }
          100% { background-position: 20px 0; }
        }
      `}</style>
    </div>
  );
};

export default ProgressBar;
