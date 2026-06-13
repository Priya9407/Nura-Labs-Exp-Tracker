import React, { useState } from 'react';
import StatusBadge from './StatusBadge';

// SVG Icons
const CheckIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);

const ClockIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const LockIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const EditIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const PlusIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const ChevronDownIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronUpIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const ObservationCard = ({
  dayNumber,
  status = 'locked',
  content,
  dueDate,
  submittedAt,
  isOverdue,
  isToday,
  isEditable,
  onEdit,
  onSubmit,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const stateConfig = {
    completed: {
      icon: CheckIcon,
      bg: 'var(--success-light)',
      border: 'var(--success)',
      iconColor: 'var(--success)',
      label: 'Submitted',
    },
    current: {
      icon: ClockIcon,
      bg: 'var(--info-light)',
      border: 'var(--info)',
      iconColor: 'var(--info)',
      label: isToday ? 'Today' : 'Current',
    },
    overdue: {
      icon: AlertIcon,
      bg: 'var(--warning-light)',
      border: 'var(--accent-orange)',
      iconColor: 'var(--accent-orange)',
      label: 'Overdue',
    },
    locked: {
      icon: LockIcon,
      bg: 'var(--bg-surface-alt)',
      border: 'var(--border)',
      iconColor: 'var(--text-muted)',
      label: 'Locked',
    },
  };

  const config = stateConfig[status] || stateConfig.locked;
  const Icon = config.icon;

  const cardStyles = {
    borderRadius: '12px',
    border: `1px solid ${config.border}`,
    padding: '16px',
    background: config.bg,
    transition: 'all 0.2s ease',
  };

  const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    cursor: content ? 'pointer' : 'default',
  };

  const leftStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  };

  const dayCircleStyles = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  };

  const labelRowStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const dayTextStyles = {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-primary)',
  };

  const statusStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 500,
    color: config.iconColor,
  };

  const dueDateStyles = {
    fontSize: '12px',
    color: 'var(--text-muted)',
  };

  const plusButtonStyles = {
    padding: '6px',
    color: 'var(--accent-coral)',
    background: 'var(--bg-surface)',
    border: '1px solid var(--accent-coral)',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
  };

  const editButtonStyles = {
    padding: '6px',
    color: 'var(--text-muted)',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  };

  const chevronStyles = {
    padding: '4px',
    color: 'var(--text-muted)',
    background: 'transparent',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  };

  const contentStyles = {
    marginTop: '12px',
    padding: '12px',
    background: 'var(--bg-surface)',
    borderRadius: '8px',
    border: '1px solid var(--border)',
  };

  const contentTextStyles = {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    margin: 0,
  };

  const submittedAtStyles = {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '8px',
  };

  return (
    <div style={cardStyles}>
      <div
        style={headerStyles}
        onClick={() => content && setIsExpanded(!isExpanded)}
      >
        <div style={leftStyles}>
          <div style={dayCircleStyles}>{dayNumber}</div>
          <div>
            <div style={labelRowStyles}>
              <span style={dayTextStyles}>Day {dayNumber}</span>
              <span style={statusStyles}>
                <Icon style={{ width: '12px', height: '12px' }} />
                {config.label}
              </span>
            </div>
            {dueDate && (
              <div style={dueDateStyles}>
                Due {new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isEditable && (status === 'current' || status === 'overdue') && onSubmit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSubmit();
              }}
              style={plusButtonStyles}
              title={status === 'overdue' ? 'Add Observation for Overdue Day' : 'Add Observation'}
            >
              <PlusIcon style={{ width: '14px', height: '14px' }} />
            </button>
          )}

          {isEditable && status === 'completed' && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              style={editButtonStyles}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-coral)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              title="Edit Observation"
            >
              <EditIcon style={{ width: '14px', height: '14px' }} />
            </button>
          )}

          {content && (
            <button
              style={{
                ...chevronStyles,
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
              title={isExpanded ? 'Hide details' : 'Show details'}
            >
              <ChevronDownIcon style={{ width: '16px', height: '16px' }} />
            </button>
          )}
        </div>
      </div>

      {isExpanded && content && (
        <div style={contentStyles}>
          <p style={contentTextStyles}>{content}</p>
          {submittedAt && (
            <div style={submittedAtStyles}>
              Submitted {new Date(submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ObservationCard;
