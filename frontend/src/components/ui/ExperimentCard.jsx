import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';
import Avatar from './Avatar';

// SVG Icons
const ArrowRightIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const SparklesIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3L9.09 9.09L3 12L9.09 14.91L12 21L14.91 14.91L21 12L14.91 9.09L12 3Z" />
  </svg>
);

const ClockIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const ExperimentCard = ({ experiment, currentUser }) => {
  const navigate = useNavigate();
  const isOwner = experiment.owner === currentUser?.uuid;

  const phase = experiment.current_phase || 'IDEA';
  const status = experiment.status || 'ACTIVE';
  const progress = experiment.phase_progress;
  const hasTimeline = experiment.timeline !== null && experiment.timeline !== undefined;
  const isOverdue = progress?.is_overdue;
  const durationDays = experiment.timeline?.testing?.duration_days || 4;
  const iterationNumber = experiment.iteration_number || 1;

  // Styles
  const cardStyles = {
    background: 'var(--bg-surface)',
    borderRadius: '16px',
    border: '1px solid var(--border)',
    padding: '20px',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  };

  const headerStyles = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '16px',
  };

  const titleSectionStyles = {
    flex: 1,
    minWidth: 0,
  };

  const badgeRowStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  };

  const titleStyles = {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    transition: 'color 0.15s ease',
    marginTop: 0,
  };

  const metaStyles = {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '4px',
  };

  const arrowContainerStyles = {
    padding: '8px',
    borderRadius: '8px',
    background: 'var(--bg-highlight)',
    opacity: 0,
    transition: 'opacity 0.2s ease',
  };

  const progressSectionStyles = {
    marginBottom: '16px',
  };

  const ideaBannerStyles = {
    padding: '10px 12px',
    borderRadius: '12px',
    background: 'var(--accent-teal-light)',
    fontSize: '12px',
    color: 'var(--accent-teal)',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const progressMetaStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    marginTop: '8px',
  };

  const dueTextStyles = {
    color: 'var(--text-muted)',
  };

  const remainingTextStyles = {
    color: isOverdue ? 'var(--error)' : 'var(--accent-teal)',
    fontWeight: isOverdue ? 600 : 400,
  };

  const footerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '16px',
    borderTop: '1px solid var(--border)',
  };

  const ownerStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const ownerTextStyles = {
    fontSize: '12px',
    color: 'var(--text-muted)',
  };

  const tagsStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '12px',
    color: 'var(--text-muted)',
  };

  const tagStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '9999px',
    background: 'var(--bg-surface-alt)',
  };

  return (
    <div
      onClick={() => navigate(`/experiment/${experiment.uuid}`)}
      style={cardStyles}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        const arrow = e.currentTarget.querySelector('.arrow-container');
        if (arrow) arrow.style.opacity = '1';
        const title = e.currentTarget.querySelector('.card-title');
        if (title) title.style.color = 'var(--accent-coral)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        e.currentTarget.style.transform = 'translateY(0)';
        const arrow = e.currentTarget.querySelector('.arrow-container');
        if (arrow) arrow.style.opacity = '0';
        const title = e.currentTarget.querySelector('.card-title');
        if (title) title.style.color = 'var(--text-primary)';
      }}
    >
      {/* Header: Badge + Title */}
      <div style={headerStyles}>
        <div style={titleSectionStyles}>
          <div style={badgeRowStyles}>
            <StatusBadge status={phase} size="small" />
            {status !== phase && (
              <StatusBadge status={status} size="small" />
            )}
            {isOverdue && (
              <StatusBadge status="OVERDUE" size="small" />
            )}
          </div>
          <h3 className="card-title" style={titleStyles}>
            {experiment.title}
          </h3>
          <p style={metaStyles}>
            {experiment.exp_no}{experiment.domain ? ` - ${experiment.domain}` : ''}
          </p>
        </div>
        <div className="arrow-container" style={arrowContainerStyles}>
          <ArrowRightIcon style={{ width: '16px', height: '16px', color: 'var(--accent-coral)' }} />
        </div>
      </div>

      {/* Progress / Timeline Info */}
      <div style={progressSectionStyles}>
        {phase === 'IDEA' ? (
          <div style={ideaBannerStyles}>
            <SparklesIcon style={{ width: '14px', height: '14px' }} />
            Idea Stage - Ready to start building
          </div>
        ) : (
          <div>
            <ProgressBar
              progress={progress?.progress_percent || 0}
              variant={isOverdue ? 'danger' : 'primary'}
              size="small"
              style={{ marginBottom: '8px' }}
            />
            <div style={progressMetaStyles}>
              {progress?.deadline && (
                <>
                  <span style={dueTextStyles}>
                    Due {progress.deadline ? new Date(progress.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                  </span>
                  <span style={remainingTextStyles}>
                    {isOverdue
                      ? `${progress.days_overdue}d overdue`
                      : `${progress.days_remaining}d remaining`
                    }
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={footerStyles}>
        <div style={ownerStyles}>
          <Avatar
            name={isOwner ? currentUser?.name : experiment.owner_info?.name}
            size="small"
          />
          <span style={ownerTextStyles}>
            {isOwner ? 'You' : (experiment.owner_info?.name || 'Unknown')}
          </span>
        </div>
        <div style={tagsStyles}>
          {iterationNumber > 1 && (
            <span style={tagStyles}>
              #{iterationNumber}
            </span>
          )}
          {experiment.current_observation_day && (
            <span style={tagStyles}>
              <ClockIcon style={{ width: '12px', height: '12px' }} />
              Day {experiment.current_observation_day}/{durationDays}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExperimentCard;
