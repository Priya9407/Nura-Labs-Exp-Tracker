import React from 'react';

const Card = ({
  children,
  style = {},
  padding = 'medium',
  shadow = 'medium',
  hover = false,
  onClick,
  header,
  footer,
  ...props
}) => {
  const paddingStyles = {
    none: { padding: 0 },
    small: { padding: '16px' },
    medium: { padding: '24px' },
    large: { padding: '32px' },
  };

  const shadowStyles = {
    none: {},
    small: { boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    medium: { boxShadow: 'var(--shadow-card)' },
    large: { boxShadow: 'var(--shadow-card-hover)' },
  };

  const baseStyles = {
    background: 'var(--bg-surface)',
    borderRadius: '16px',
    border: '1px solid var(--border)',
    transition: 'all 0.2s ease',
    ...paddingStyles[padding],
    ...shadowStyles[shadow],
    ...style,
  };

  const headerStyles = {
    paddingBottom: '20px',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border)',
  };

  const footerStyles = {
    paddingTop: '20px',
    marginTop: '20px',
    borderTop: '1px solid var(--border)',
  };

  return (
    <div
      style={{
        ...baseStyles,
        cursor: hover ? 'pointer' : 'default',
      }}
      onClick={onClick}
      onMouseEnter={hover ? (e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      } : undefined}
      onMouseLeave={hover ? (e) => {
        e.currentTarget.style.boxShadow = shadowStyles[shadow].boxShadow || 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      } : undefined}
      {...props}
    >
      {header && <div style={headerStyles}>{header}</div>}
      {children}
      {footer && <div style={footerStyles}>{footer}</div>}
    </div>
  );
};

export default Card;
