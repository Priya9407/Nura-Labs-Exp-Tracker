import React, { useState, useCallback } from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  style = {},
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const getVariantStyles = () => {
    const variants = {
      primary: {
        background: 'var(--accent-coral)',
        color: 'white',
        hoverBackground: 'var(--accent-coral-hover)',
      },
      secondary: {
        background: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border)',
        hoverBackground: 'var(--bg-highlight)',
      },
      success: {
        background: 'var(--accent-teal)',
        color: 'white',
        hoverBackground: 'var(--accent-teal-hover)',
      },
      danger: {
        background: 'var(--accent-coral)',
        color: 'white',
        hoverBackground: 'var(--accent-coral-hover)',
      },
      warning: {
        background: 'var(--accent-orange)',
        color: 'white',
        hoverBackground: '#E09500',
      },
      ghost: {
        background: 'transparent',
        color: 'var(--text-secondary)',
        hoverBackground: 'var(--bg-highlight)',
        hoverColor: 'var(--text-primary)',
      },
      outline: {
        background: 'transparent',
        color: 'var(--accent-coral)',
        border: '1px solid var(--accent-coral)',
        hoverBackground: 'var(--accent-coral-light)',
      },
      teal: {
        background: 'var(--accent-teal)',
        color: 'white',
        hoverBackground: 'var(--accent-teal-hover)',
      },
    };
    return variants[variant] || variants.primary;
  };

  const getSizeStyles = () => {
    const sizes = {
      small: { padding: '6px 12px', fontSize: '12px', gap: '6px' },
      medium: { padding: '10px 20px', fontSize: '13px', gap: '8px' },
      large: { padding: '14px 28px', fontSize: '14px', gap: '10px' },
    };
    return sizes[size] || sizes.medium;
  };

  const getActiveScale = useCallback(() => {
    if (isActive && !disabled && !loading) {
      return 'scale(0.97)';
    }
    return 'scale(1)';
  }, [isActive, disabled, loading]);

  const getFocusRing = useCallback(() => {
    if (isFocused && !disabled) {
      return '0 0 0 3px var(--accent-coral-light)';
    }
    return 'none';
  }, [isFocused, disabled]);

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  // Calculate hover background
  const hoverBackground = isHovered && !disabled && !loading
    ? variantStyles.hoverBackground || variantStyles.background
    : variantStyles.background;

  const hoverColor = isHovered && !disabled && !loading
    ? variantStyles.hoverColor || variantStyles.color
    : variantStyles.color;

  const buttonStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    borderRadius: '10px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'all 0.15s ease',
    border: variantStyles.border || 'none',
    background: hoverBackground,
    color: hoverColor,
    boxShadow: getFocusRing(),
    transform: getActiveScale(),
    outline: 'none',
    ...sizeStyles,
    ...style,
  };

  const handleMouseEnter = useCallback((e) => {
    setIsHovered(true);
    props.onMouseEnter?.(e);
  }, [props.onMouseEnter]);

  const handleMouseLeave = useCallback((e) => {
    setIsHovered(false);
    setIsActive(false);
    props.onMouseLeave?.(e);
  }, [props.onMouseLeave]);

  const handleMouseDown = useCallback((e) => {
    setIsActive(true);
    props.onMouseDown?.(e);
  }, [props.onMouseDown]);

  const handleMouseUp = useCallback((e) => {
    setIsActive(false);
    props.onMouseUp?.(e);
  }, [props.onMouseUp]);

  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    props.onFocus?.(e);
  }, [props.onFocus]);

  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    setIsActive(false);
    props.onBlur?.(e);
  }, [props.onBlur]);

  const iconStyles = {
    width: '16px',
    height: '16px',
  };

  const Spinner = () => (
    <svg
      style={{ ...iconStyles, animation: 'spin 0.8s linear infinite' }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );

  // Filter out custom event handlers from props to avoid conflicts
  const { onMouseEnter, onMouseLeave, onMouseDown, onMouseUp, onFocus, onBlur, ...restProps } = props;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={buttonStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...restProps}
    >
      {loading ? (
        <>
          <Spinner />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {iconPosition === 'left' && Icon && <Icon style={iconStyles} />}
          {children}
          {iconPosition === 'right' && Icon && <Icon style={iconStyles} />}
        </>
      )}
    </button>
  );
};

export default Button;
