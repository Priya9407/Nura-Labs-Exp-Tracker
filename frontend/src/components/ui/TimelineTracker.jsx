import React from 'react';

// Phase Icons
const IdeaIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const BuildIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const WaitIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const TestIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3L7 17a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2L15 3" />
    <path d="M6 3h12" />
    <path d="M12 14v4" />
  </svg>
);

const DecisionIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12l2 2 4-4" />
    <path d="M21 12c.552 0 1-.448 1-1V8a2 2 0 0 0-2-2h-3.5" />
    <path d="M3 12c-.552 0-1-.448-1-1V8a2 2 0 0 1 2-2h3.5" />
    <path d="M21 12c.552 0 1 .448 1 1v3a2 2 0 0 1-2 2h-3.5" />
    <path d="M3 12c-.552 0-1 .448-1 1v3a2 2 0 0 0 2 2h3.5" />
  </svg>
);

const FinishIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21l9-9" />
    <path d="M12 3v18" />
    <path d="M5.64 5.64l12.72 12.72" />
    <path d="M18.36 5.64L5.64 18.36" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const CheckIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PHASE_CONFIG = {
  IDEA: { icon: IdeaIcon, label: 'Idea', shortLabel: 'Idea' },
  BUILDING: { icon: BuildIcon, label: 'Building', shortLabel: 'Build' },
  TESTING: { icon: TestIcon, label: 'Testing', shortLabel: 'Test' },
  DECISION: { icon: DecisionIcon, label: 'Decision', shortLabel: 'Decide' },
  COMPLETED: { icon: FinishIcon, label: 'Completed', shortLabel: 'Done' },
  // Legacy phase mappings for backwards compatibility
  WAITING_FOR_TEST: { icon: WaitIcon, label: 'Waiting', shortLabel: 'Wait' },
  USER_TESTING: { icon: TestIcon, label: 'Testing', shortLabel: 'Test' },
  DECISION_PENDING: { icon: DecisionIcon, label: 'Decision', shortLabel: 'Decide' },
  FINISHED: { icon: FinishIcon, label: 'Finished', shortLabel: 'Done' },
};

const TimelineTracker = ({
  phases = ['IDEA', 'BUILDING', 'TESTING', 'DECISION', 'COMPLETED'],
  currentPhase,
  completedPhases = [],
  isOverdue = false,
  isPaused = false,
  isCancelled = false,
  orientation = 'horizontal',
  style = {},
}) => {
  const getPhaseStatus = (phase) => {
    if (isCancelled) {
      if (completedPhases.includes(phase) || phase === currentPhase) {
        return 'cancelled';
      }
      return 'disabled';
    }

    if (isPaused && phase === currentPhase) {
      return 'paused';
    }

    if (completedPhases.includes(phase)) {
      return 'completed';
    }

    if (phase === currentPhase) {
      if (isOverdue) return 'overdue';
      return 'current';
    }

    return 'pending';
  };

  const getStatusStyles = (status) => {
    const baseStyles = {
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    };

    switch (status) {
      case 'completed':
        return {
          ...baseStyles,
          background: 'var(--success)',
          border: '2px solid var(--success)',
          color: 'var(--text-inverse)',
          boxShadow: '0 2px 8px var(--success-light)',
        };
      case 'current':
        return {
          ...baseStyles,
          background: 'var(--accent-coral)',
          border: '2px solid var(--accent-coral)',
          color: 'var(--text-inverse)',
          boxShadow: '0 4px 16px var(--accent-coral-light)',
          transform: 'scale(1.1)',
        };
      case 'overdue':
        return {
          ...baseStyles,
          background: 'var(--accent-orange)',
          border: '2px solid var(--accent-orange)',
          color: 'var(--text-inverse)',
          boxShadow: '0 4px 16px var(--accent-orange-light)',
          animation: 'pulse-warning 2s infinite',
        };
      case 'paused':
        return {
          ...baseStyles,
          background: 'var(--accent-orange)',
          border: '2px solid var(--accent-orange)',
          color: 'var(--text-inverse)',
        };
      case 'cancelled':
        return {
          ...baseStyles,
          background: 'var(--text-muted)',
          border: '2px solid var(--text-muted)',
          color: 'var(--text-inverse)',
        };
      case 'disabled':
        return {
          ...baseStyles,
          background: 'var(--bg-surface-alt)',
          border: '2px solid var(--border)',
          color: 'var(--text-muted)',
          opacity: 0.5,
        };
      default:
        return {
          ...baseStyles,
          background: 'var(--bg-surface)',
          border: '2px solid var(--border)',
          color: 'var(--text-muted)',
        };
    }
  };

  const getConnectorStyles = (index) => {
    const currentIndex = phases.indexOf(currentPhase);
    const isBeforeCurrent = index < currentIndex;

    if (isCancelled) {
      if (isBeforeCurrent) {
        return { background: 'var(--text-muted)', opacity: 0.5 };
      }
      return { background: 'var(--border)' };
    }

    if (isBeforeCurrent) {
      return { background: 'var(--success)' };
    }

    return { background: 'var(--border)' };
  };

  // Horizontal Layout
  if (orientation === 'horizontal') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '4px',
          padding: '24px 16px 16px',
          position: 'relative',
          ...style,
        }}
      >
        {/* Background Track */}
        <div
          style={{
            position: 'absolute',
            top: '45px',
            left: '48px',
            right: '48px',
            height: '2px',
            background: 'var(--border)',
            zIndex: 0,
          }}
        />

        {/* Progress Track */}
        <div
          style={{
            position: 'absolute',
            top: '45px',
            left: '48px',
            width: isCancelled
              ? '0%'
              : `${Math.max(0, ((phases.indexOf(currentPhase) + (completedPhases.includes(currentPhase) ? 1 : 0.5)) / (phases.length - 1)) * 100)}%`,
            maxWidth: `calc(100% - 96px)`,
            height: '2px',
            background: isCancelled ? 'transparent' : 'var(--success)',
            zIndex: 1,
            transition: 'width 0.5s ease',
          }}
        />

        {phases.map((phase, index) => {
          const status = getPhaseStatus(phase);
          const config = PHASE_CONFIG[phase] || PHASE_CONFIG.IDEA;
          const Icon = config.icon;
          const isLast = index === phases.length - 1;

          return (
            <div
              key={phase}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                flex: isLast ? 0 : 1,
                minWidth: '60px',
                zIndex: 2,
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  ...getStatusStyles(status),
                }}
              >
                {status === 'completed' ? (
                  <CheckIcon style={{ width: '20px', height: '20px' }} />
                ) : (
                  <Icon style={{ width: '20px', height: '20px' }} />
                )}
              </div>
              <div
                style={{
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: status === 'current'
                      ? 'var(--accent-coral)'
                      : status === 'completed'
                      ? 'var(--success)'
                      : status === 'overdue'
                      ? 'var(--accent-orange)'
                      : 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {config.label}
                </span>
                {status === 'overdue' && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 500,
                      color: 'var(--accent-orange)',
                      background: 'var(--accent-orange-light)',
                      padding: '1px 6px',
                      borderRadius: '10px',
                    }}
                  >
                    Overdue
                  </span>
                )}
                {status === 'paused' && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 500,
                      color: 'var(--accent-orange)',
                      background: 'var(--accent-orange-light)',
                      padding: '1px 6px',
                      borderRadius: '10px',
                    }}
                  >
                    Paused
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Vertical Layout (Mobile)
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '16px',
        ...style,
      }}
    >
      {phases.map((phase, index) => {
        const status = getPhaseStatus(phase);
        const config = PHASE_CONFIG[phase] || PHASE_CONFIG.IDEA;
        const Icon = config.icon;
        const isLast = index === phases.length - 1;

        return (
          <div
            key={phase}
            style={{
              display: 'flex',
              gap: '16px',
            }}
          >
            {/* Left: Icon & Connector */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '44px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  ...getStatusStyles(status),
                }}
              >
                {status === 'completed' ? (
                  <CheckIcon style={{ width: '20px', height: '20px' }} />
                ) : (
                  <Icon style={{ width: '20px', height: '20px' }} />
                )}
              </div>
              {!isLast && (
                <div
                  style={{
                    width: '2px',
                    height: '24px',
                    marginTop: '4px',
                    borderRadius: '1px',
                    alignSelf: 'center',
                    ...getConnectorStyles(index),
                    transition: 'all 0.3s ease',
                  }}
                />
              )}
            </div>

            {/* Right: Info */}
            <div
              style={{
                flex: 1,
                paddingTop: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: status === 'current'
                      ? 'var(--accent-coral)'
                      : status === 'completed'
                      ? 'var(--success)'
                      : status === 'overdue'
                      ? 'var(--accent-orange)'
                      : 'var(--text-primary)',
                  }}
                >
                  {config.label}
                </span>
                {status === 'overdue' && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'var(--accent-orange)',
                      background: 'var(--accent-orange-light)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                    }}
                  >
                    Overdue
                  </span>
                )}
                {status === 'paused' && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'var(--accent-orange)',
                      background: 'var(--accent-orange-light)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                    }}
                  >
                    Paused
                  </span>
                )}
              </div>
              {status === 'current' && (
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    marginTop: '2px',
                  }}
                >
                  Current phase
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimelineTracker;
