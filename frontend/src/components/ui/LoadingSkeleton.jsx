import React from 'react';

export const SkeletonLine = ({ width = '100%', style = {} }) => (
  <div
    style={{
      height: '16px',
      background: 'var(--bg-surface-alt)',
      borderRadius: '6px',
      width,
      animation: 'pulse 2s ease-in-out infinite',
      ...style,
    }}
  />
);

export const SkeletonText = ({ lines = 3, style = {} }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', ...style }}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonLine key={i} width={i === lines - 1 ? '60%' : '100%'} />
    ))}
  </div>
);

export const SkeletonCard = ({ style = {} }) => (
  <div
    style={{
      background: 'var(--bg-surface)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      padding: '24px',
      ...style,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: 'var(--bg-surface-alt)',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SkeletonLine width="40%" />
        <SkeletonLine width="25%" />
      </div>
    </div>
    <SkeletonText lines={2} />
  </div>
);

export const SkeletonStatCard = ({ style = {} }) => (
  <div
    style={{
      background: 'var(--bg-surface)',
      borderRadius: '16px',
      border: '1px solid var(--border)',
      padding: '24px',
      animation: 'pulse 2s ease-in-out infinite',
      ...style,
    }}
  >
    <div
      style={{
        height: '16px',
        background: 'var(--bg-surface-alt)',
        borderRadius: '6px',
        width: '60%',
        marginBottom: '12px',
      }}
    />
    <div
      style={{
        height: '32px',
        background: 'var(--bg-surface-alt)',
        borderRadius: '6px',
        width: '40%',
        marginBottom: '8px',
      }}
    />
    <div
      style={{
        height: '12px',
        background: 'var(--bg-surface-alt)',
        borderRadius: '6px',
        width: '50%',
      }}
    />
  </div>
);
