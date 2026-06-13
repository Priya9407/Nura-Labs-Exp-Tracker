import React from 'react';

const Avatar = ({ name, src, size = 'medium', style = {} }) => {
  const sizeStyles = {
    small: { width: '28px', height: '28px', fontSize: '10px' },
    medium: { width: '36px', height: '36px', fontSize: '12px' },
    large: { width: '44px', height: '44px', fontSize: '14px' },
    xlarge: { width: '56px', height: '56px', fontSize: '16px' },
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getColor = (name) => {
    const colors = [
      { bg: '#166534', text: 'white' },
      { bg: '#D97706', text: 'white' },
      { bg: '#7C3AED', text: 'white' },
      { bg: '#0891B2', text: 'white' },
      { bg: '#DC2626', text: 'white' },
      { bg: '#2563EB', text: 'white' },
    ];
    const index = name?.length % colors.length || 0;
    return colors[index];
  };

  const sizeStyle = sizeStyles[size] || sizeStyles.medium;
  const color = getColor(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid var(--bg-surface)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          ...sizeStyle,
          ...style,
        }}
      />
    );
  }

  return (
    <div
      style={{
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        background: color.bg,
        color: color.text,
        ...sizeStyle,
        ...style,
      }}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
