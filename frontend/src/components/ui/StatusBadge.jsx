import React from 'react';

// SVG Icons
const LightbulbIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18h6M10 22h4M12 2a7 7 0 00-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 002 2h4a2 2 0 002-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 00-7-7z" />
  </svg>
);

const HammerIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 2L3 12h9l-1 8 10-10h-9l1-8z" />
  </svg>
);

const HourglassIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v18M7 3h10v5a5 5 0 01-10 0V3zM7 21h10v-5a5 5 0 00-10 0v5z" />
  </svg>
);

const FlaskIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 3L7 17a2 2 0 002 2h6a2 2 0 002-2L15 3" />
    <path d="M6 3h12" />
  </svg>
);

const FileQuestionIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" />
    <path d="M14 2v6h6M10 15.5v.5M10 12a2 2 0 114 0c0 2-3 2-3 4v1" />
  </svg>
);

const FlagIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
  </svg>
);

const PlayCircleIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M10 8l6 4-6 4V8z" />
  </svg>
);

const PauseCircleIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M10 15V9M14 15V9" />
  </svg>
);

const CheckCircleIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const XCircleIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9l-6 6M9 9l6 6" />
  </svg>
);

const ClockIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const AlertCircleIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);

const statusConfig = {
  // Phase statuses (simplified 5 phases)
  IDEA: { icon: LightbulbIcon, bg: 'var(--accent-coral-light)', text: 'var(--accent-coral)', label: 'Idea' },
  BUILDING: { icon: HammerIcon, bg: 'var(--accent-orange-light)', text: 'var(--accent-orange)', label: 'Building' },
  TESTING: { icon: FlaskIcon, bg: 'var(--info-light)', text: 'var(--info)', label: 'Testing' },
  DECISION: { icon: FileQuestionIcon, bg: 'var(--accent-coral-light)', text: 'var(--accent-coral)', label: 'Decision' },
  COMPLETED: { icon: FlagIcon, bg: 'var(--accent-teal-light)', text: 'var(--accent-teal)', label: 'Completed' },
  // Experiment statuses
  ACTIVE: { icon: PlayCircleIcon, bg: 'var(--accent-teal-light)', text: 'var(--accent-teal)', label: 'Active' },
  PAUSED: { icon: PauseCircleIcon, bg: 'var(--accent-orange-light)', text: 'var(--accent-orange)', label: 'Paused' },
  CANCELLED: { icon: XCircleIcon, bg: 'var(--error-light)', text: 'var(--error)', label: 'Cancelled' },
  ARCHIVED: { icon: ClockIcon, bg: 'var(--bg-surface-alt)', text: 'var(--text-muted)', label: 'Archived' },
  // Observation statuses
  CURRENT: { icon: ClockIcon, bg: 'var(--info-light)', text: 'var(--info)', label: 'Current' },
  OVERDUE: { icon: AlertCircleIcon, bg: 'var(--warning-light)', text: 'var(--warning)', label: 'Overdue' },
  LOCKED: { icon: ClockIcon, bg: 'var(--bg-surface-alt)', text: 'var(--text-muted)', label: 'Locked' },
  SUBMITTED: { icon: CheckCircleIcon, bg: 'var(--success-light)', text: 'var(--success)', label: 'Submitted' },
  // Decision types
  ADD: { icon: CheckCircleIcon, bg: 'var(--success-light)', text: 'var(--success)', label: 'Add' },
  DROP: { icon: XCircleIcon, bg: 'var(--error-light)', text: 'var(--error)', label: 'Drop' },
  ITERATE: { icon: PlayCircleIcon, bg: 'var(--accent-orange-light)', text: 'var(--accent-orange)', label: 'Iterate' },
};

const StatusBadge = ({ status, size = 'medium', showIcon = true, style = {} }) => {
  const config = statusConfig[status] || statusConfig.IDEA;
  const Icon = config.icon;

  const sizeStyles = {
    small: { padding: '2px 8px', fontSize: '11px', gap: '4px' },
    medium: { padding: '4px 10px', fontSize: '12px', gap: '6px' },
    large: { padding: '6px 12px', fontSize: '13px', gap: '8px' },
  };

  const iconSizes = {
    small: { width: '12px', height: '12px' },
    medium: { width: '14px', height: '14px' },
    large: { width: '16px', height: '16px' },
  };

  const badgeStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: 500,
    borderRadius: '8px',
    border: `1px solid ${config.bg}`,
    background: config.bg,
    color: config.text,
    ...sizeStyles[size],
    ...style,
  };

  return (
    <span style={badgeStyles}>
      {showIcon && <Icon style={iconSizes[size]} />}
      {config.label}
    </span>
  );
};

export default StatusBadge;
