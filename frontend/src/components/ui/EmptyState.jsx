import React from 'react';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  style = {},
}) => {
  const containerStyles = {
    textAlign: 'center',
    padding: '64px 24px',
    ...style,
  };

  const iconContainerStyles = {
    margin: '0 auto 16px',
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'var(--bg-surface-alt)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const iconStyles = {
    width: '24px',
    height: '24px',
    color: 'var(--text-muted)',
  };

  const titleStyles = {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '4px',
  };

  const descriptionStyles = {
    fontSize: '14px',
    color: 'var(--text-muted)',
    maxWidth: '320px',
    margin: '0 auto 24px',
    lineHeight: 1.5,
  };

  const buttonStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-inverse)',
    background: 'var(--accent-coral)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  return (
    <div style={containerStyles}>
      {Icon && (
        <div style={iconContainerStyles}>
          <Icon style={iconStyles} />
        </div>
      )}
      {title && <h3 style={titleStyles}>{title}</h3>}
      {description && <p style={descriptionStyles}>{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={buttonStyles}
          onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
        >
          {action}
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
