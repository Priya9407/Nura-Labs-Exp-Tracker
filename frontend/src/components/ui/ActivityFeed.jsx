import React from 'react';
import Avatar from './Avatar';

// SVG Icons
const ArrowRightIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const FileTextIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
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
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const XCircleIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9l-6 6M9 9l6 6" />
  </svg>
);

const RotateCcwIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 2v6h6" />
    <path d="M3 13a9 9 0 101.8-5.5L3 8" />
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

const CalendarIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
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

const activityIcons = {
  phase_change: ArrowRightIcon,
  phase_changed: ArrowRightIcon,
  observation_submitted: FileTextIcon,
  observation_edited: EditIcon,
  experiment_created: PlusIcon,
  experiment_cancelled: XCircleIcon,
  experiment_reopened: RotateCcwIcon,
  experiment_paused: PauseCircleIcon,
  experiment_resumed: CheckCircleIcon,
  decision_submitted: CheckCircleIcon,
  extension_granted: CalendarIcon,
  iteration_created: RotateCcwIcon,
  overdue_alert: AlertCircleIcon,
  build_started: ArrowRightIcon,
  build_completed: CheckCircleIcon,
  testing_started: ArrowRightIcon,
  testing_completed: CheckCircleIcon,
  testing_scheduled: CalendarIcon,
  testing_schedule_edited: EditIcon,
};

const activityColors = {
  phase_change: { icon: 'var(--info)', bg: 'var(--info-light)' },
  phase_changed: { icon: 'var(--info)', bg: 'var(--info-light)' },
  observation_submitted: { icon: 'var(--success)', bg: 'var(--success-light)' },
  observation_edited: { icon: 'var(--accent-orange)', bg: 'var(--accent-orange-light)' },
  experiment_created: { icon: 'var(--accent-coral)', bg: 'var(--accent-coral-light)' },
  experiment_cancelled: { icon: 'var(--error)', bg: 'var(--error-light)' },
  experiment_reopened: { icon: 'var(--info)', bg: 'var(--info-light)' },
  experiment_paused: { icon: 'var(--accent-orange)', bg: 'var(--accent-orange-light)' },
  experiment_resumed: { icon: 'var(--success)', bg: 'var(--success-light)' },
  decision_submitted: { icon: 'var(--success)', bg: 'var(--success-light)' },
  extension_granted: { icon: 'var(--accent-orange)', bg: 'var(--accent-orange-light)' },
  iteration_created: { icon: 'var(--info)', bg: 'var(--info-light)' },
  overdue_alert: { icon: 'var(--error)', bg: 'var(--error-light)' },
  build_started: { icon: 'var(--info)', bg: 'var(--info-light)' },
  build_completed: { icon: 'var(--success)', bg: 'var(--success-light)' },
  testing_started: { icon: 'var(--info)', bg: 'var(--info-light)' },
  testing_completed: { icon: 'var(--success)', bg: 'var(--success-light)' },
  testing_scheduled: { icon: 'var(--accent-teal)', bg: 'var(--accent-teal-light)' },
  testing_schedule_edited: { icon: 'var(--accent-orange)', bg: 'var(--accent-orange-light)' },
};

const ActivityFeed = ({ activities = [], allActivities = [], emptyMessage = 'No recent activity', onDateClick, selectedDate, activityFilterDate, showDateHeaders = true }) => {
  // Use activities for showing items
  const displayActivities = activities;

  if (displayActivities.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '32px 16px',
        minHeight: '160px',
        minWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        border: '1px dashed var(--border)',
        background: 'var(--bg-surface-alt)',
      }}>
        <ClockIcon style={{ width: '32px', height: '32px', color: 'var(--text-muted)', margin: '0 auto 12px', opacity: 0.5 }} />
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>{emptyMessage}</p>
      </div>
    );
  }

  // Group ALL activities by date for headers
  const groupedActivities = allActivities.reduce((groups, activity) => {
    const date = new Date(activity.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {});

  // Sort dates (newest first)
  const sortedDates = Object.keys(groupedActivities).sort((a, b) =>
    new Date(b) - new Date(a)
  );

  // Group displayed activities
  const displayedGroupedActivities = activities.reduce((groups, activity) => {
    const date = new Date(activity.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {});

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const dateHeaderStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'var(--bg-surface-alt)',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    cursor: onDateClick ? 'pointer' : 'default',
    transition: 'all 0.15s ease',
    border: '1px solid transparent',
  };

  const dateHeaderSelectedStyles = {
    background: 'var(--accent-coral-light)',
    color: 'var(--accent-coral)',
    borderColor: 'var(--accent-coral)',
  };

  const dateHeaderHoverStyles = {
    background: 'var(--bg-highlight)',
  };

  const itemStyles = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '8px 0',
  };

  const iconContainerStyles = {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '0',
  };

  const contentStyles = {
    flex: 1,
    minWidth: 0,
  };

  const textStyles = {
    fontSize: '13px',
    color: 'var(--text-primary)',
    lineHeight: 1.5,
  };

  const actorStyles = {
    fontWeight: 600,
  };

  const descriptionStyles = {
    color: 'var(--text-secondary)',
  };

  const detailsStyles = {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const timestampStyles = {
    fontSize: '12px',
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    marginTop: '2px',
  };

  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Only show dates that have activities in the filtered list (unless showing all)
  const datesToShow = selectedDate || activityFilterDate
    ? sortedDates.filter(date => displayedGroupedActivities[date])
    : sortedDates;

  // If showing on dashboard (no date headers), just show flat list
  if (!showDateHeaders) {
    // Format date for display (Today, Yesterday, or date)
    const formatActivityDate = (timestamp) => {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    };

    return (
      <div style={containerStyles}>
        {displayActivities.map((activity, index) => {
          const Icon = activityIcons[activity.action_type] || ClockIcon;
          const colors = activityColors[activity.action_type] || { icon: 'var(--text-muted)', bg: 'var(--bg-surface-alt)' };

          return (
            <div key={activity.id || index} style={itemStyles}>
              <div style={{ ...iconContainerStyles, background: colors.bg }}>
                <Icon style={{ width: '16px', height: '16px', color: colors.icon }} />
              </div>
              <div style={contentStyles}>
                <p style={textStyles}>
                  <span style={actorStyles}>{activity.actor_name || 'System'}</span>
                  {' '}
                  <span style={descriptionStyles}>{activity.description || activity.action_type}</span>
                </p>
                {activity.experiment_title && (
                  <p style={detailsStyles}>in "{activity.experiment_title}"</p>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <span style={timestampStyles}>
                  {activity.timestamp
                    ? new Date(activity.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : ''
                  }
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {formatActivityDate(activity.timestamp)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // If filtered to a specific date, only show that date's header
  const visibleDates = selectedDate
    ? [selectedDate]
    : activityFilterDate
      ? datesToShow
      : sortedDates.slice(0, 7); // Show last 7 days by default

  return (
    <div style={containerStyles}>
      {visibleDates.map((date) => {
        const isSelected = selectedDate === date ||
          (activityFilterDate && new Date(activityFilterDate).toDateString() === date);
        const allDateActivities = groupedActivities[date] || [];
        const displayedDateActivities = displayedGroupedActivities[date] || [];

        // Skip if no activities to display for this date
        if (displayedDateActivities.length === 0 && (selectedDate || activityFilterDate)) {
          return null;
        }

        return (
          <div key={date} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
              style={{
                ...dateHeaderStyles,
                ...(isSelected ? dateHeaderSelectedStyles : {}),
              }}
              onClick={() => onDateClick && onDateClick(date)}
              onMouseEnter={(e) => {
                if (onDateClick && !isSelected) {
                  e.currentTarget.style.background = dateHeaderHoverStyles.background;
                }
              }}
              onMouseLeave={(e) => {
                if (onDateClick && !isSelected) {
                  e.currentTarget.style.background = dateHeaderStyles.background;
                }
              }}
            >
              <CalendarIcon style={{ width: '14px', height: '14px' }} />
              {formatDateHeader(date)}
              <span style={{
                marginLeft: 'auto',
                fontSize: '11px',
                color: isSelected ? 'var(--accent-coral)' : 'var(--text-muted)',
                fontWeight: 500
              }}>
                {allDateActivities.length} activity{allDateActivities.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {displayedDateActivities.map((activity, index) => {
                const Icon = activityIcons[activity.action_type] || ClockIcon;
                const colors = activityColors[activity.action_type] || { icon: 'var(--text-muted)', bg: 'var(--bg-surface-alt)' };

                return (
                  <div key={activity.id || index} style={itemStyles}>
                    <div style={{ ...iconContainerStyles, background: colors.bg }}>
                      <Icon style={{ width: '16px', height: '16px', color: colors.icon }} />
                    </div>
                    <div style={contentStyles}>
                      <p style={textStyles}>
                        <span style={actorStyles}>{activity.actor_name || 'System'}</span>
                        {' '}
                        <span style={descriptionStyles}>{activity.description || activity.action_type}</span>
                      </p>
                      {activity.experiment_title && (
                        <p style={detailsStyles}>in "{activity.experiment_title}"</p>
                      )}
                    </div>
                    <span style={timestampStyles}>
                      {activity.timestamp
                        ? new Date(activity.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : ''
                      }
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityFeed;
