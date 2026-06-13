import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as experimentsAPI from '../api/experiments';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime, getPhaseDisplay } from '../utils/format';
import Modal from '../components/Modal';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import AlertBanner from '../components/ui/AlertBanner';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';

const PHASES = ['IDEA', 'BUILDING', 'TESTING', 'DECISION', 'COMPLETED'];

const ArrowLeftIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const FlaskIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 3L7 17a2 2 0 002 2h6a2 2 0 002-2L15 3" />
    <path d="M6 3h12" />
  </svg>
);

const AlertCircleIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);

const CalendarIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const FileTextIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>
);

const inputStyles = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--bg-surface-alt)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--text-primary)',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const textareaStyles = {
  ...inputStyles,
  minHeight: '100px',
  resize: 'vertical',
  fontFamily: 'inherit',
};

const labelStyles = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const phaseCopy = {
  IDEA: {
    title: 'Ready to start',
    description: 'Start building when the idea is ready to enter the two-day build window.',
  },
  BUILDING: {
    title: 'Build in progress',
    description: 'Complete the build when the experiment is ready for testing setup.',
  },
  TESTING: {
    title: 'Testing in progress',
    description: 'Capture observations for today and any overdue testing days.',
  },
  DECISION: {
    title: 'Decision pending',
    description: 'Review the testing notes and submit Add, Drop, or Iterate.',
  },
  COMPLETED: {
    title: 'Completed',
    description: 'This experiment has finished its lifecycle.',
  },
};

function ExperimentDetail() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [experiment, setExperiment] = useState(null);
  const [observations, setObservations] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [iterations, setIterations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [confirmAction, setConfirmAction] = useState(null);
  const [showTestingModal, setShowTestingModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [testingDuration, setTestingDuration] = useState(4);
  const [scheduledDate, setScheduledDate] = useState('');
  const [extendDate, setExtendDate] = useState('');
  const [extendDays, setExtendDays] = useState(1);
  const [extendReason, setExtendReason] = useState('');
  const [decision, setDecision] = useState('');
  const [decisionReason, setDecisionReason] = useState('');
  const [observationDay, setObservationDay] = useState(null);
  const [observationContent, setObservationContent] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const loadExperiment = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await experimentsAPI.getExperiment(uuid);
      const nextExperiment = response.experiment;
      setExperiment(nextExperiment);
      setTestingDuration(nextExperiment?.scheduled_testing?.duration_days || nextExperiment?.timeline?.testing?.duration_days || 4);
    } catch (err) {
      setError(err.message || 'Failed to load experiment');
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  const loadSupportingData = useCallback(async () => {
    try {
      const [observationsResponse, scheduleResponse, iterationsResponse, activitiesResponse] = await Promise.allSettled([
        experimentsAPI.listObservations(uuid),
        experimentsAPI.getObservationSchedule(uuid),
        experimentsAPI.listIterations(uuid),
        experimentsAPI.getExperimentActivities(uuid),
      ]);

      if (observationsResponse.status === 'fulfilled') {
        setObservations(observationsResponse.value.observations || []);
      }

      if (scheduleResponse.status === 'fulfilled') {
        setSchedule(scheduleResponse.value.schedule || []);
      } else {
        setSchedule([]);
      }

      if (iterationsResponse.status === 'fulfilled') {
        setIterations(iterationsResponse.value.iterations || []);
      }

      if (activitiesResponse.status === 'fulfilled') {
        setActivities(activitiesResponse.value.activities || []);
      }
    } catch (err) {
      console.error('Failed to load experiment support data:', err);
    }
  }, [uuid]);

  useEffect(() => {
    loadExperiment();
  }, [loadExperiment]);

  useEffect(() => {
    if (!experiment) return;
    loadSupportingData();
  }, [experiment, loadSupportingData]);

  const canModify = experiment && experiment.status === 'ACTIVE' && (experiment.owner === user?.uuid || isAdmin);
  const currentPhase = experiment?.current_phase || 'IDEA';
  const phaseIndex = Math.max(PHASES.indexOf(currentPhase), 0);
  const progress = experiment?.phase_progress || {};
  const timeline = experiment?.timeline || {};
  const observationStatus = experiment?.observation_status || {};
  const allowedActions = experiment?.allowed_actions || [];
  const phaseText = phaseCopy[currentPhase] || {
    title: getPhaseDisplay(currentPhase),
    description: 'Review the current experiment state.',
  };

  const scheduleDays = useMemo(() => {
    const source = schedule.length > 0 ? schedule : observationStatus.days || [];
    return source.map((day) => {
      const observation = observations.find((item) => item.day_number === day.day_number);
      const status = day.status ||
        (observation ? 'completed' : day.is_today || day.is_current ? 'current' : day.is_past || day.is_overdue ? 'overdue' : 'locked');

      return {
        ...day,
        status,
        observation,
        canSubmit: day.can_submit,
      };
    });
  }, [schedule, observationStatus.days, observations]);

  const pendingObservationDays = useMemo(
    () => scheduleDays.filter((day) => phaseIndex >= 2 && day.canSubmit && !day.observation),
    [phaseIndex, scheduleDays]
  );

  const primaryActions = useMemo(() => (
    allowedActions.filter((action) => !action.action?.startsWith('extend_'))
  ), [allowedActions]);

  const secondaryActions = useMemo(() => (
    allowedActions.filter((action) => action.action?.startsWith('extend_'))
  ), [allowedActions]);

  const activeDeadline = progress.deadline;
  const ownerName = experiment?.owner_info?.name || 'Unknown';

  const refreshAfterAction = async () => {
    setIsRefreshing(true);
    try {
      const [expRes] = await Promise.allSettled([experimentsAPI.getExperiment(uuid)]);
      if (expRes.status === 'fulfilled') {
        const nextExp = expRes.value.experiment;
        setExperiment(nextExp);
        setTestingDuration(nextExp?.scheduled_testing?.duration_days || nextExp?.timeline?.testing?.duration_days || 4);
      }
      const [obsRes, schedRes, iterRes, actRes] = await Promise.allSettled([
        experimentsAPI.listObservations(uuid),
        experimentsAPI.getObservationSchedule(uuid),
        experimentsAPI.listIterations(uuid),
        experimentsAPI.getExperimentActivities(uuid),
      ]);
      if (obsRes.status === 'fulfilled') setObservations(obsRes.value.observations || []);
      if (schedRes.status === 'fulfilled') setSchedule(schedRes.value.schedule || []);
      if (iterRes.status === 'fulfilled') setIterations(iterRes.value.iterations || []);
      if (actRes.status === 'fulfilled') setActivities(actRes.value.activities || []);
    } finally {
      setIsRefreshing(false);
    }
  };

  const openScheduleModal = (isEdit = false) => {
    setScheduledDate((experiment?.scheduled_testing?.start_date || '').slice(0, 10));
    setTestingDuration(experiment?.scheduled_testing?.duration_days || experiment?.timeline?.testing?.duration_days || 4);
    setShowScheduleModal(isEdit ? 'edit' : 'schedule');
  };

  const openExtendModal = () => {
    const phase = actionToExtendPhase(currentPhase);
    const phaseTimeline = timeline[phase] || {};
    const currentDeadline = phaseTimeline.extended_deadline || phaseTimeline.deadline || progress.deadline;
    setExtendDate(currentDeadline ? currentDeadline.slice(0, 10) : '');
    setExtendDays(1);
    setExtendReason('');
    setShowExtendModal(true);
  };

  const openObservationModal = (dayNumber) => {
    const existing = observations.find(o => o.day_number === dayNumber);
    setObservationDay(dayNumber);
    setObservationContent(existing ? existing.content : '');
    setShowObservationModal(true);
  };

  const handleAction = (action) => {
    const name = action.action;
    if (name === 'start_building' || name === 'complete_building' || name === 'complete_testing') {
      setConfirmAction(action);
      return;
    }
    if (name === 'start_testing') {
      setTestingDuration(experiment?.scheduled_testing?.duration_days || experiment?.timeline?.testing?.duration_days || 4);
      setShowTestingModal(true);
      return;
    }
    if (name === 'schedule_testing') {
      openScheduleModal(false);
      return;
    }
    if (name === 'edit_schedule' || name === 'reschedule_testing') {
      openScheduleModal(true);
      return;
    }
    if (name?.startsWith('extend_')) {
      openExtendModal();
      return;
    }
    if (name === 'submit_decision') {
      setDecision('');
      setDecisionReason('');
      setShowDecisionModal(true);
    }
  };

  const runConfirmedAction = async () => {
    try {
      if (confirmAction.action === 'start_building') {
        await experimentsAPI.startBuild(uuid);
      } else if (confirmAction.action === 'complete_building') {
        await experimentsAPI.completeBuild(uuid);
      } else if (confirmAction.action === 'complete_testing') {
        await experimentsAPI.completeTesting(uuid);
      }
      setConfirmAction(null);
      await refreshAfterAction();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  const handleStartTesting = async () => {
    try {
      await experimentsAPI.startTesting(uuid, Number(testingDuration));
      setShowTestingModal(false);
      await refreshAfterAction();
    } catch (err) {
      alert(err.message || 'Failed to start testing');
    }
  };

  const handleScheduleTesting = async () => {
    if (!scheduledDate) {
      alert('Select a testing start date.');
      return;
    }
    try {
      if (showScheduleModal === 'edit') {
        await experimentsAPI.editTestingSchedule(uuid, scheduledDate, Number(testingDuration));
      } else {
        await experimentsAPI.scheduleTesting(uuid, scheduledDate, Number(testingDuration));
      }
      setShowScheduleModal(false);
      await refreshAfterAction();
    } catch (err) {
      alert(err.message || 'Failed to save testing schedule');
    }
  };

  const handleExtend = async () => {
    const phase = actionToExtendPhase(currentPhase);
    let finalDate = extendDate;

    if (phase === 'testing') {
      const phaseTimeline = timeline[phase] || {};
      const currentDeadlineStr = phaseTimeline.extended_deadline || phaseTimeline.deadline || progress.deadline;
      if (!currentDeadlineStr) {
        alert('Cannot determine current deadline.');
        return;
      }
      const extra = parseInt(extendDays, 10);
      if (!extra || extra < 1) {
        alert('Days to add must be at least 1.');
        return;
      }
      // Parse as local date (split to avoid UTC timezone shift)
      const [year, month, day] = currentDeadlineStr.slice(0, 10).split('-').map(Number);
      const d = new Date(year, month - 1, day);
      d.setDate(d.getDate() + extra);
      const yy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      finalDate = `${yy}-${mm}-${dd}`;
    } else {
      if (!finalDate) {
        alert('Select a new deadline.');
        return;
      }
    }

    if (extendReason.trim().length < 10) {
      alert('Reason must be at least 10 characters.');
      return;
    }
    try {
      await experimentsAPI.extendDeadline(uuid, phase, finalDate, extendReason.trim());
      setShowExtendModal(false);
      await refreshAfterAction();
    } catch (err) {
      alert(err.message || 'Failed to extend deadline');
    }
  };

  const handleObservation = async () => {
    if (!observationDay) {
      alert('Select a testing day.');
      return;
    }
    if (observationContent.trim().length < 5) {
      alert('Observation must be at least 5 characters.');
      return;
    }
    try {
      await experimentsAPI.submitObservation(uuid, observationDay, observationContent.trim());
      setShowObservationModal(false);
      await refreshAfterAction();
    } catch (err) {
      alert(err.message || 'Failed to add observation');
    }
  };

  const handleDecision = async () => {
    if (!decision) {
      alert('Select a decision.');
      return;
    }
    if (decisionReason.trim().length < 20) {
      alert('Decision reason must be at least 20 characters.');
      return;
    }
    try {
      await experimentsAPI.submitDecision(uuid, decision, decisionReason.trim());
      setShowDecisionModal(false);
      await refreshAfterAction();
    } catch (err) {
      alert(err.message || 'Failed to submit decision');
    }
  };

  const handleCancel = async () => {
    if (cancelReason.trim().length < 10) {
      alert('Cancellation reason must be at least 10 characters.');
      return;
    }
    try {
      await experimentsAPI.cancelExperiment(uuid, cancelReason.trim());
      setShowCancelModal(false);
      await refreshAfterAction();
    } catch (err) {
      alert(err.message || 'Failed to cancel experiment');
    }
  };

  if (loading) {
    return (
      <div className="ed-loading">
        <div className="ed-spinner" />
        <p>Loading experiment details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircleIcon}
        title="Error loading experiment"
        description={error}
        actionLabel="Back to experiments"
        onAction={() => navigate('/experiments')}
      />
    );
  }

  if (!experiment) {
    return (
      <EmptyState
        icon={FlaskIcon}
        title="Experiment not found"
        actionLabel="Back to experiments"
        onAction={() => navigate('/experiments')}
      />
    );
  }

  return (
    <>
      <style>{styles}</style>
      {isRefreshing && (
        <div className="ed-refresh-bar">
          <div className="ed-refresh-bar-fill" />
        </div>
      )}
      <div className="ed-wrap animate-fade-in">
        <button className="ed-back" onClick={() => navigate('/experiments')}>
          <ArrowLeftIcon style={{ width: 16, height: 16 }} />
          Back to Experiments
        </button>

        {/* Header Section */}
        <div className="ed-header-card">
          <div className="ed-header-content">
            <div className="ed-badges">
              <StatusBadge status={currentPhase} size="small" />
              <StatusBadge status={experiment.status} size="small" />
              {progress.is_overdue && <StatusBadge status="OVERDUE" size="small" />}
            </div>
            <h1 className="ed-title">{experiment.title}</h1>
            <p className="ed-subtitle">{phaseText.description}</p>
          </div>
          
          {canModify && (
            <div className="ed-actions">
              {primaryActions.map((action) => (
                <Button
                  key={action.action}
                  size="medium"
                  variant={action.action === 'complete_testing' ? 'success' : 'primary'}
                  onClick={() => handleAction(action)}
                >
                  {action.label}
                </Button>
              ))}
              {secondaryActions.map((action) => (
                <Button key={action.action} size="medium" variant="secondary" onClick={() => handleAction(action)}>
                  {action.label}
                </Button>
              ))}
              <Button size="medium" variant="secondary" onClick={() => setShowCancelModal(true)}>
                Cancel
              </Button>
            </div>
          )}
        </div>

        {experiment.status === 'CANCELLED' && (
          <AlertBanner variant="warning" title="Experiment Cancelled">
            {experiment.cancellation_reason || 'This experiment has been cancelled.'}
          </AlertBanner>
        )}

        {pendingObservationDays.length > 0 && canModify && (
          <div className="ed-action-banner">
            <div className="ed-banner-text">
              <h2>Observations Needed</h2>
              <p>Add notes for today or any overdue testing days to stay on track.</p>
            </div>
            <div className="ed-banner-actions">
              {pendingObservationDays.map((day) => (
                <Button
                  key={day.day_number}
                  size="small"
                  variant={day.status === 'overdue' ? 'warning' : 'primary'}
                  onClick={() => openObservationModal(day.day_number)}
                >
                  {day.status === 'overdue' ? `Add Overdue (Day ${day.day_number})` : `Add Observation (Day ${day.day_number})`}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Phase Tracker */}
        <div className="ed-phase-tracker">
          <PhaseRail currentPhase={currentPhase} activeDeadline={activeDeadline} progress={progress} />
        </div>

        {/* Two Column Grid */}
        <div className="ed-grid">
          {/* Left Column */}
          <div className="ed-column">
            <Card padding="none" shadow="small" className="ed-card" style={{ padding: '12px 20px 18px' }}>
              <SectionHeader icon={FileTextIcon} title="Experiment Details" />
              <div className="ed-meta-list">
                <MetaItem label="Experiment Number" value={experiment.exp_no} />
                <MetaItem label="Department" value={experiment.domain || 'Not specified'} />
                <MetaItem label="Created At" value={formatDateTime(experiment.created_at)} />
                <div className="ed-owner-item">
                  <span className="ed-label">Owner</span>
                  <div className="ed-owner-info">
                    <Avatar name={ownerName} size="small" />
                    <div>
                      <strong>{ownerName}</strong>
                      {experiment.owner_info?.email && <span>{experiment.owner_info.email}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card padding="none" shadow="small" className="ed-card" style={{ padding: '12px 20px 18px' }}>
              <SectionHeader icon={FlaskIcon} title="Hypothesis & Notes" />
              <div className="ed-notes">
                {experiment.assumption_statement ? (
                  <TextItem label="Assumption Statement" value={experiment.assumption_statement} />
                ) : null}
                {experiment.target_user ? (
                  <TextItem label="Target User" value={experiment.target_user} />
                ) : null}
                {!experiment.assumption_statement && !experiment.target_user && (
                  <p className="ed-empty-text">No detailed hypothesis or user defined yet.</p>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="ed-column">
            <Card padding="none" shadow="small" className="ed-card" style={{ padding: '12px 20px 18px' }}>
              <SectionHeader icon={CalendarIcon} title="Timeline" />
              <div className="ed-timeline-list">
                <TimelineItem label="Build Phase" data={timeline.build} active={currentPhase === 'BUILDING'} />
                <TimelineItem
                  label="Testing Phase"
                  data={timeline.testing}
                  active={currentPhase === 'TESTING'}
                  scheduled={experiment.scheduled_testing}
                />
                <TimelineItem label="Decision Phase" data={timeline.decision} active={currentPhase === 'DECISION'} />
              </div>
            </Card>
            
            {experiment.decision && (
              <Card padding="none" shadow="small" className="ed-card" style={{ padding: '12px 20px 18px' }}>
                <SectionHeader icon={FileTextIcon} title="Final Decision" />
                <div className="ed-decision-box">
                  <div className="ed-decision-header">
                    <StatusBadge status={experiment.decision.decision} size="medium" />
                    <span>{formatDateTime(experiment.decision.submitted_at)}</span>
                  </div>
                  <p className="ed-decision-text">{experiment.decision.reason}</p>
                </div>
              </Card>
            )}
            
            {iterations.length > 1 && (
              <Card padding="none" shadow="small" className="ed-card" style={{ padding: '12px 20px 18px' }}>
                <SectionHeader icon={FlaskIcon} title="Iterations" />
                <div className="ed-iterations-list">
                  {iterations.map((item) => (
                    <div
                      key={item.uuid}
                      className={`ed-iteration-card ${item.uuid === experiment.uuid ? 'active' : ''}`}
                      onClick={() => item.uuid !== experiment.uuid && navigate(`/experiment/${item.uuid}`)}
                    >
                      <div className="ed-iteration-header">
                        <strong>Iteration {item.iteration_number || item.current_iteration || 1}</strong>
                        <StatusBadge status={item.current_phase} size="small" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activities.filter(a => a.activity_type === 'extension_granted').length > 0 && (() => {
              const DETAIL_KEY_MAP = {
                reason: 'Reason',
                new_deadline: 'New Deadline',
                phase: 'Phase',
              };
              const extensions = activities.filter(a => a.activity_type === 'extension_granted');
              return (
                <Card padding="none" shadow="small" className="ed-card" style={{ padding: '12px 20px 18px' }}>
                  <SectionHeader icon={FileTextIcon} title="Extensions" />
                  <div className="ed-activity-list">
                    {extensions.map((act, i) => (
                      <div key={act.id || i} className="ed-activity-item" style={{ borderLeftColor: 'var(--warning)' }}>
                        <div className="ed-activity-header">
                          <span className="ed-activity-tag" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
                            {(act.details?.phase || 'Phase').replace(/_/g, ' ')} Extended
                          </span>
                          <span>{formatDateTime(act.created_at)}</span>
                        </div>
                        <p className="ed-activity-user">{act.user_name || act.user_email || 'System'}</p>
                        {act.details && (
                          <div className="ed-activity-details">
                            {Object.entries(act.details)
                              .filter(([k]) => DETAIL_KEY_MAP[k])
                              .map(([k, v]) => (
                                <span key={k}>
                                  <b>{DETAIL_KEY_MAP[k]}:</b> {k === 'new_deadline' ? formatDate(v) : String(v)}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })()}
          </div>
        </div>

        {/* Observations Section */}
        {phaseIndex >= 2 && (
          <Card padding="large" shadow="small" className="ed-card">
            <div className="ed-section-header">
              <div className="ed-section-title">
                <span className="ed-icon-wrap">
                  <FileTextIcon style={{ width: 18, height: 18 }} />
                </span>
                <h2>Testing Observations</h2>
              </div>
            </div>
            
            {scheduleDays.length === 0 ? (
              <p className="ed-empty-text ed-centered">The observation schedule will appear once testing starts.</p>
            ) : (
              <div className="ed-obs-grid">
                {scheduleDays.map((day) => (
                  <ObservationTile
                    key={day.day_number}
                    day={day}
                    canModify={canModify}
                    onSubmit={() => openObservationModal(day.day_number)}
                  />
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Modals remain mostly the same structurally but rely on new styles */}
      <ConfirmModal
        action={confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={runConfirmedAction}
      />

      <Modal
        isOpen={showTestingModal}
        onClose={() => setShowTestingModal(false)}
        title="Start Testing"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowTestingModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleStartTesting}>Start Testing</Button>
          </>
        }
      >
        <Field label="Testing duration (Days)">
          <input
            type="number"
            min={1}
            max={14}
            value={testingDuration}
            onChange={(event) => setTestingDuration(event.target.value)}
            style={inputStyles}
          />
        </Field>
        <p className="ed-modal-hint">Choose 1 to 14 days. Observations are collected daily.</p>
      </Modal>

      <Modal
        isOpen={Boolean(showScheduleModal)}
        onClose={() => setShowScheduleModal(false)}
        title={showScheduleModal === 'edit' ? 'Edit Testing Schedule' : 'Schedule Testing'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleScheduleTesting}>
              {showScheduleModal === 'edit' ? 'Save Schedule' : 'Schedule'}
            </Button>
          </>
        }
      >
        <div className="ed-form-stack">
          <Field label="Start Date">
            <input
              type="date"
              value={scheduledDate}
              onChange={(event) => setScheduledDate(event.target.value)}
              style={inputStyles}
            />
          </Field>
          <Field label="Duration (Days)">
            <input
              type="number"
              min={1}
              max={14}
              value={testingDuration}
              onChange={(event) => setTestingDuration(event.target.value)}
              style={inputStyles}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        isOpen={showExtendModal}
        onClose={() => setShowExtendModal(false)}
        title={`Extend ${getPhaseDisplay(currentPhase)} Phase`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowExtendModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleExtend}>Save Extension</Button>
          </>
        }
      >
        <div className="ed-form-stack">
          {actionToExtendPhase(currentPhase) === 'testing' ? (
            <>
              <div className="ed-extend-summary">
                <span>Current duration:</span>
                <strong>{timeline?.testing?.duration_days || observationStatus?.duration_days || 4} days</strong>
              </div>
              <Field label="Days to Add">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={extendDays}
                  onChange={(e) => setExtendDays(Math.max(1, parseInt(e.target.value) || 1))}
                  style={inputStyles}
                />
              </Field>
              <p className="ed-modal-hint">
                New total: <strong>{(timeline?.testing?.duration_days || observationStatus?.duration_days || 4) + (parseInt(extendDays) || 0)} days</strong>. Observation slots will be added automatically.
              </p>
            </>
          ) : (
            <Field label="New Deadline Date">
              <input
                type="date"
                value={extendDate}
                onChange={(event) => setExtendDate(event.target.value)}
                style={inputStyles}
              />
            </Field>
          )}
          <Field label="Reason for Extension">
            <textarea
              value={extendReason}
              onChange={(event) => setExtendReason(event.target.value)}
              placeholder="Why is this extension needed?"
              style={textareaStyles}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        isOpen={showObservationModal}
        onClose={() => setShowObservationModal(false)}
        title={`Add Observation - Day ${observationDay || ''}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowObservationModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleObservation}>Submit Observation</Button>
          </>
        }
      >
        <Field label="Observation Notes">
          <textarea
            value={observationContent}
            onChange={(event) => setObservationContent(event.target.value)}
            placeholder="What did you observe today?"
            style={textareaStyles}
          />
        </Field>
        <p className="ed-modal-hint">You can add observations for today and overdue days only.</p>
      </Modal>

      <Modal
        isOpen={showDecisionModal}
        onClose={() => setShowDecisionModal(false)}
        title="Submit Final Decision"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowDecisionModal(false)}>Cancel</Button>
            <Button variant="success" onClick={handleDecision}>Submit Decision</Button>
          </>
        }
      >
        <div className="ed-form-stack">
          <Field label="Decision Outcome">
            <select value={decision} onChange={(event) => setDecision(event.target.value)} style={inputStyles}>
              <option value="">Select an outcome</option>
              <option value="ADD">Add (Success)</option>
              <option value="DROP">Drop (Failure)</option>
              <option value="ITERATE">Iterate (Retry)</option>
            </select>
          </Field>
          <Field label="Decision Rationale">
            <textarea
              value={decisionReason}
              onChange={(event) => setDecisionReason(event.target.value)}
              placeholder="Explain why this decision was made."
              style={textareaStyles}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Experiment"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCancelModal(false)}>Keep Active</Button>
            <Button variant="danger" onClick={handleCancel}>Confirm Cancel</Button>
          </>
        }
      >
        <Field label="Reason for Cancellation">
          <textarea
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="Why are you cancelling this experiment completely?"
            style={textareaStyles}
          />
        </Field>
      </Modal>
    </>
  );
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="ed-section-header">
      <div className="ed-section-title">
        <span className="ed-icon-wrap">
          <Icon style={{ width: 18, height: 18 }} />
        </span>
        <h2>{title}</h2>
      </div>
    </div>
  );
}

function MetaItem({ label, value }) {
  return (
    <div className="ed-meta-item">
      <span className="ed-label">{label}</span>
      <strong className="ed-value">{value || 'N/A'}</strong>
    </div>
  );
}

function TextItem({ label, value }) {
  return (
    <div className="ed-text-item">
      <span className="ed-label">{label}</span>
      <p className="ed-text">{value}</p>
    </div>
  );
}

function PhaseRail({ currentPhase, activeDeadline, progress }) {
  const currentIndex = PHASES.indexOf(currentPhase);

  return (
    <div className="ed-phase-rail-container">
      <div className="ed-phase-header">
        <h3>Experiment Progress</h3>
        {activeDeadline && (
          <DeadlineBadge progress={progress} deadline={activeDeadline} />
        )}
      </div>
      <div className="ed-phase-steps">
        {PHASES.map((phase, index) => {
          const isDone = index < currentIndex;
          const isActive = index === currentIndex;
          let stepClass = 'ed-step-node';
          if (isDone) stepClass += ' done';
          if (isActive) stepClass += ' active';
          
          return (
            <div key={phase} className="ed-step-wrap">
              <div className="ed-step-line"></div>
              <div className={stepClass}></div>
              <span className={`ed-step-label ${isActive ? 'active' : ''}`}>
                {getPhaseDisplay(phase)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeadlineBadge({ progress, deadline }) {
  const label = progress.is_overdue
    ? `${progress.days_overdue || 0} day${progress.days_overdue === 1 ? '' : 's'} overdue`
    : `${progress.days_remaining ?? 0} day${progress.days_remaining === 1 ? '' : 's'} left`;

  return (
    <div className={progress.is_overdue ? 'ed-deadline-chip overdue' : 'ed-deadline-chip'}>
      <strong>{label}</strong>
      <span>{formatDate(deadline)}</span>
    </div>
  );
}

function TimelineItem({ label, data, active, scheduled }) {
  const start = data?.actual_start;
  const end = data?.actual_end || data?.extended_deadline || data?.deadline;
  const state = data?.is_completed || data?.actual_end ? 'Completed' : active ? 'Active' : scheduled ? 'Scheduled' : data ? 'Planned' : 'Pending';
  
  const dateText = scheduled && !data?.actual_start
    ? `Starts ${formatDate(scheduled.start_date)}`
    : start || end
      ? `${start ? formatDate(start) : 'TBD'} ${end ? `→ ${formatDate(end)}` : ''}`
      : '--';

  return (
    <div className={`ed-timeline-row ${active ? 'active' : ''}`}>
      <div className="ed-timeline-info">
        <strong>{label}</strong>
        <span className={`ed-timeline-status ${state.toLowerCase()}`}>{state}</span>
      </div>
      <div className="ed-timeline-date">{dateText}</div>
    </div>
  );
}

function ObservationTile({ day, canModify, onSubmit }) {
  const isPending = canModify && day.canSubmit;
  const hasContent = !!day.observation?.content;
  
  let statusClass = 'pending';
  if (day.status === 'completed') statusClass = 'completed';
  if (day.status === 'current') statusClass = 'current';
  if (day.status === 'overdue') statusClass = 'overdue';
  if (day.status === 'locked') statusClass = 'locked';

  return (
    <div className={`ed-obs-tile ${statusClass}`}>
      <div className="ed-obs-header">
        <div className="ed-obs-day">Day {day.day_number}</div>
        <div className="ed-obs-date">{day.date ? formatDate(day.date) : ''}</div>
      </div>
      <div className="ed-obs-body">
        {hasContent ? (
          <div>
            <p>{day.observation.content}</p>
            {canModify && (
              <button className="ed-obs-edit-btn" onClick={onSubmit}>
                Edit Notes
              </button>
            )}
          </div>
        ) : isPending ? (
          <button className="ed-obs-btn" onClick={onSubmit}>
            + Add Notes
          </button>
        ) : (
          <p className="ed-obs-empty">No observations recorded.</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="ed-field">
      <span style={labelStyles}>{label}</span>
      {children}
    </div>
  );
}

function ConfirmModal({ action, onClose, onConfirm }) {
  return (
    <Modal
      isOpen={Boolean(action)}
      onClose={onClose}
      title={action?.label || 'Confirm Action'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm}>Confirm</Button>
        </>
      }
    >
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
        {action?.description || 'Are you sure you want to proceed with this action?'}
      </p>
    </Modal>
  );
}

function actionToExtendPhase(currentPhase) {
  if (currentPhase === 'BUILDING') return 'build';
  if (currentPhase === 'TESTING') return 'testing';
  if (currentPhase === 'DECISION') return 'decision';
  return '';
}

const styles = `
  /* Refresh Bar */
  .ed-refresh-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    z-index: 9999;
    background: var(--bg-surface-alt);
  }
  .ed-refresh-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-coral), var(--accent-orange));
    animation: ed-refresh-progress 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  @keyframes ed-refresh-progress {
    0%   { width: 0%; margin-left: 0%; }
    50%  { width: 70%; margin-left: 15%; }
    100% { width: 0%; margin-left: 100%; }
  }

  /* Layout & Container */
  .ed-wrap {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    padding: 24px 16px 48px;
  }

  @media (min-width: 768px) {
    .ed-wrap {
      padding: 32px 24px 64px;
      gap: 28px;
    }
  }

  .ed-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--text-secondary);
    background: transparent;
    border: none;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    width: fit-content;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.2s ease;
    margin-left: -8px;
  }
  .ed-back:hover {
    color: var(--accent-coral);
    background: var(--bg-surface-alt);
    transform: translateX(-2px);
  }

  /* Header Card */
  .ed-header-card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 24px 28px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    box-shadow: var(--shadow-card);
  }

  @media (max-width: 768px) {
    .ed-header-card {
      padding: 20px 20px;
      gap: 16px;
    }
  }

  .ed-header-content {
    flex: 1;
    min-width: 0;
    z-index: 1;
  }

  .ed-badges {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .ed-title {
    font-size: 28px;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1.2;
    margin-bottom: 10px;
    margin-top:20px;
    letter-spacing: -0.02em;
  }

  @media (max-width: 768px) {
    .ed-title {
      font-size: 22px;
    }
  }

  .ed-subtitle {
    font-size: 14px;
    color: var(--text-secondary);
    max-width: 640px;
    line-height: 1.5;
  }

  .ed-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: flex-end;
    z-index: 1;
  }
  
  .ed-actions button {
    font-size: 13px;
    padding: 8px 16px;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
  }
  .ed-actions button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  .ed-actions button:active {
    transform: translateY(0);
  }

  /* Banners */
  .ed-action-banner {
    background: var(--warning-light);
    border: 1px solid var(--warning);
    border-radius: var(--radius-md);
    padding: 18px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    animation: slideIn 0.3s ease-out;
    box-shadow: var(--shadow-card);
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .ed-banner-text h2 {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
  }
  .ed-banner-text p {
    font-size: 13px;
    color: var(--text-secondary);
  }
  
  .ed-banner-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
  
  .ed-banner-actions button {
    font-size: 12px;
    padding: 6px 12px;
  }

  /* Grid Layout */
  .ed-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
  }

  @media (min-width: 1024px) {
    .ed-grid {
      grid-template-columns: 1fr 1fr;
      gap: 28px;
    }
  }

  .ed-column {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .ed-card {
    height: 100%;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    border: 1px solid var(--border-light) !important;
    background: var(--bg-surface) !important;
    padding-top: 16px !important;
    padding-bottom: 24px !important;
    border-radius: var(--radius-lg) !important;
    box-shadow: var(--shadow-card);
  }

  .ed-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-card-hover);
    border-color: var(--border);
  }

  /* Section Headers */
  .ed-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    margin-top: 0;
    border-bottom: 1px solid var(--border-light);
    padding-bottom: 14px;
  }

  .ed-section-title {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ed-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 6px;
    background: var(--bg-surface-alt);
    color: var(--accent-coral);
  }

  .ed-section-title h2 {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom:10px;
    margin-top:12px;
  }

  /* Phase Rail */
  .ed-phase-tracker {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 24px 28px;
    box-shadow: var(--shadow-card);
  }

  @media (max-width: 768px) {
    .ed-phase-tracker {
      padding: 20px 16px;
    }
  }

  .ed-phase-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .ed-phase-header h3 {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
  }

  .ed-deadline-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--accent-teal-light);
    padding: 4px 12px;
    border-radius: var(--radius-full);
  }
  .ed-deadline-chip.overdue {
    background: var(--warning-light);
  }
  .ed-deadline-chip strong {
    font-size: 12px;
    color: var(--accent-teal);
  }
  .ed-deadline-chip.overdue strong {
    color: var(--warning);
  }
  .ed-deadline-chip span {
    font-size: 11px;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .ed-phase-steps {
    display: flex;
    justify-content: space-between;
    position: relative;
    // padding-top: 8px;
  }

  .ed-step-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }
  
  .ed-step-wrap:first-child .ed-step-line { left: 50%; width: 50%; }
  .ed-step-wrap:last-child .ed-step-line { right: 50%; width: 50%; }

  .ed-step-line {
    position: absolute;
    top: 6px;
    left: 0;
    width: 100%;
    height: 3px;
    background: var(--border-light);
    z-index: 1;
    transition: background 0.5s ease;
  }
  
  .ed-step-wrap.done .ed-step-line,
  .ed-step-node.done ~ .ed-step-line {
    background: var(--accent-coral);
  }

  .ed-step-node {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--bg-surface-alt);
    border: 3px solid var(--border-light);
    z-index: 2;
    position: relative;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  .ed-step-node.done {
    background: var(--accent-coral);
    border-color: var(--accent-coral);
    box-shadow: 0 0 8px rgba(239, 106, 95, 0.3);
  }
  
  .ed-step-node.active {
    background: var(--bg-surface);
    border-color: var(--accent-coral);
    box-shadow: 0 0 0 4px var(--accent-coral-light), 0 0 12px rgba(239, 106, 95, 0.3);
    transform: scale(1.1);
  }

  .ed-step-label {
    margin-top: 12px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: color 0.3s ease;
  }
  
  .ed-step-label.active {
    color: var(--accent-coral);
    font-weight: 800;
  }

  /* List Items */
  .ed-meta-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .ed-meta-item, .ed-text-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ed-label {
    font-size: 11px;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
  }

  .ed-value {
    font-size: 13px;
    color: var(--text-primary);
    font-weight: 500;
  }
  
  .ed-text {
    font-size: 13px;
    color: var(--text-primary);
    line-height: 1.5;
    background: var(--bg-surface-alt);
    padding: 12px;
    border-radius: var(--radius-sm);
    border-left: 3px solid var(--accent-teal);
  }

  .ed-owner-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 4px;
    padding: 8px;
    background: var(--bg-surface-alt);
    border-radius: var(--radius-sm);
  }
  
  .ed-owner-info div {
    display: flex;
    flex-direction: column;
  }
  
  .ed-owner-info strong {
    font-size: 13px;
    font-weight: 600;
  }
  
  .ed-owner-info span {
    font-size: 11px;
    color: var(--text-secondary);
  }

  /* Timeline */
  .ed-timeline-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .ed-timeline-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
    background: var(--bg-surface-alt);
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    transition: all 0.2s ease;
  }
  
  .ed-timeline-row:hover {
    background: var(--bg-surface);
    border-color: var(--border);
  }
  
  .ed-timeline-row.active {
    background: var(--bg-surface);
    border-color: var(--accent-teal);
  }
  
  .ed-timeline-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .ed-timeline-info strong {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-primary);
  }
  
  .ed-timeline-status {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .ed-timeline-status.completed { color: var(--success); }
  .ed-timeline-status.active { color: var(--accent-teal); }
  .ed-timeline-status.scheduled { color: var(--info); }
  .ed-timeline-status.planned, .ed-timeline-status.pending { color: var(--text-muted); }
  
  .ed-timeline-date {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    text-align: right;
  }

  /* Decision & Iterations */
  .ed-decision-box {
    background: var(--bg-surface-alt);
    padding: 14px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-light);
  }
  
  .ed-decision-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  
  .ed-decision-header span {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
  }
  
  .ed-decision-text {
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-primary);
  }

  .ed-iterations-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .ed-iteration-card {
    padding: 12px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    background: var(--bg-surface-alt);
    flex: 1;
    min-width: 120px;
  }
  
  .ed-iteration-card:hover {
    border-color: var(--accent-coral);
    transform: translateY(-1px);
  }
  
  .ed-iteration-card.active {
    background: var(--accent-coral-light);
    border-color: var(--accent-coral);
  }
  
  .ed-iteration-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  
  .ed-iteration-header strong {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-primary);
  }
  
  .ed-iteration-card.active strong {
    color: var(--accent-coral);
  }

  /* Activity Log */
  .ed-activity-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
    padding-right: 8px;
  }
  
  .ed-activity-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    background: var(--bg-surface-alt);
    border-radius: var(--radius-sm);
    border-left: 3px solid var(--border);
  }
  
  .ed-activity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .ed-activity-header strong {
    font-size: 12px;
    color: var(--text-primary);
  }
  
  .ed-activity-tag {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 20px;
    letter-spacing: 0.03em;
  }
  
  .ed-activity-header span {
    font-size: 11px;
    color: var(--text-secondary);
  }
  
  .ed-activity-user {
    font-size: 11px;
    color: var(--text-secondary);
    margin: 0;
  }
  
  .ed-activity-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px dashed var(--border-light);
  }
  
  .ed-activity-details span {
    font-size: 11px;
    color: var(--text-secondary);
  }
  
  .ed-activity-details b {
    color: var(--text-primary);
    text-transform: capitalize;
  }

  /* Observations Grid */
  .ed-obs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
  }

  @media (max-width: 640px) {
    .ed-obs-grid {
      grid-template-columns: 1fr;
    }
  }

  .ed-obs-tile {
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    background: var(--bg-surface);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: all 0.25s ease;
    position: relative;
    box-shadow: var(--shadow-card);
  }

  .ed-obs-tile:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-card-hover);
    border-color: var(--border);
  }
  
  .ed-obs-tile.current { border-color: var(--info); }
  .ed-obs-tile.overdue { border-color: var(--warning); }
  .ed-obs-tile.completed { border-color: var(--success); }
  .ed-obs-tile.locked { 
    background: var(--bg-surface-alt); 
    opacity: 0.6; 
    box-shadow: none;
    transform: none;
  }

  .ed-obs-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
    border-bottom: 1px solid var(--border-light);
    background: var(--bg-surface-alt);
  }
  
  .ed-obs-tile.current .ed-obs-header { background: var(--info-light); }
  .ed-obs-tile.overdue .ed-obs-header { background: var(--warning-light); }
  .ed-obs-tile.completed .ed-obs-header { background: var(--success-light); }
  
  .ed-obs-day {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-primary);
  }
  
  .ed-obs-date {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .ed-obs-body {
    padding: 18px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  
  .ed-obs-body p {
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-primary);
    margin-bottom: 8px;
  }
  
  .ed-obs-empty {
    color: var(--text-muted) !important;
    font-style: italic;
    text-align: center;
    margin: auto 0;
    font-size: 13px;
  }
  
  .ed-obs-btn {
    width: 100%;
    padding: 8px;
    background: transparent;
    border: 1px dashed var(--accent-coral);
    border-radius: 6px;
    color: var(--accent-coral);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: auto;
  }
  
  .ed-obs-btn:hover {
    background: var(--accent-coral-light);
    border-style: solid;
  }

  .ed-obs-edit-btn {
    align-self: flex-start;
    background: transparent;
    border: none;
    color: var(--accent-coral);
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;
    margin-top: 4px;
    opacity: 0.7;
  }

  .ed-obs-tile:hover .ed-obs-edit-btn {
    opacity: 1;
    background: var(--accent-coral-light);
  }

  /* Modals & Forms */
  .ed-extend-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg-surface-alt);
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    color: var(--text-secondary);
  }
  .ed-extend-summary strong {
    color: var(--accent-coral);
    font-size: 14px;
  }
  .ed-form-stack {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .ed-field {
    display: flex;
    flex-direction: column;
  }
  
  .ed-modal-hint {
    margin-top: 8px;
    font-size: 12px;
    color: var(--text-secondary);
    font-style: italic;
  }

  /* Loading */
  .ed-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    gap: 16px;
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
  }
  
  /* Utils */
  .ed-centered { text-align: center; }

  /* Responsive Adjustments */
  @media (max-width: 768px) {
    .ed-header-card {
      flex-direction: column;
      padding: 24px;
    }
    
    .ed-actions {
      width: 100%;
      justify-content: flex-start;
    }
    
    .ed-action-banner {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .ed-banner-actions {
      width: 100%;
      flex-wrap: wrap;
    }
    
    .ed-phase-tracker {
      padding: 24px 16px;
    }
    
    .ed-step-label {
      font-size: 11px;
    }
    
    .ed-obs-grid {
      grid-template-columns: 1fr;
    }
  }

`;

export default ExperimentDetail;
