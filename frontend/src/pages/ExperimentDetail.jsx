import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as experimentsAPI from '../api/experiments';
import { useAuth } from '../context/AuthContext';
import {
  getPhaseDisplay,
  getPhaseColor,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  getDecisionDisplay,
  getDecisionColor,
  getStatusColor,
} from '../utils/format';
import Modal from '../components/Modal';

const PHASES = ['IDEA', 'BUILDING', 'WAITING_FOR_TEST', 'USER_TESTING', 'DECISION_PENDING', 'FINISHED'];

function ExperimentDetail() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [experiment, setExperiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Modal states
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Form states
  const [newPhase, setNewPhase] = useState('');
  const [extendPhase, setExtendPhase] = useState('');
  const [extendDate, setExtendDate] = useState('');
  const [extendReason, setExtendReason] = useState('');
  const [decision, setDecision] = useState('');
  const [decisionReason, setDecisionReason] = useState('');
  const [observationContent, setObservationContent] = useState('');

  const [observations, setObservations] = useState([]);
  const [observationsLoading, setObservationsLoading] = useState(false);

  const loadExperiment = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await experimentsAPI.getExperiment(uuid);
      setExperiment(response.experiment);
      setNewPhase(response.experiment.current_phase);
    } catch (err) {
      setError(err.message || 'Failed to load experiment');
    } finally {
      setLoading(false);
    }
  };

  const loadObservations = async () => {
    setObservationsLoading(true);
    try {
      const response = await experimentsAPI.listObservations(uuid);
      setObservations(response.observations || []);
    } catch (err) {
      console.error('Failed to load observations:', err);
    } finally {
      setObservationsLoading(false);
    }
  };

  useEffect(() => {
    loadExperiment();
    loadObservations();
  }, [uuid]);

  const isOwner = experiment?.owner === user?.uuid;
  const canModify = isOwner || isAdmin;

  const handlePhaseChange = async () => {
    try {
      await experimentsAPI.updatePhase(uuid, newPhase);
      setShowPhaseModal(false);
      await loadExperiment();
    } catch (err) {
      alert(err.message || 'Failed to update phase');
    }
  };

  const handleExtend = async () => {
    if (!extendReason.trim()) {
      alert('Reason is required');
      return;
    }
    try {
      await experimentsAPI.extendDeadline(uuid, extendPhase, extendDate, extendReason);
      setShowExtendModal(false);
      setExtendReason('');
      await loadExperiment();
    } catch (err) {
      alert(err.message || 'Failed to extend deadline');
    }
  };

  const handleDecision = async () => {
    if (!decisionReason.trim() || decisionReason.length < 20) {
      alert('Reason must be at least 20 characters');
      return;
    }
    try {
      await experimentsAPI.submitDecision(uuid, decision, decisionReason);
      setShowDecisionModal(false);
      setDecisionReason('');
      await loadExperiment();
    } catch (err) {
      alert(err.message || 'Failed to submit decision');
    }
  };

  const handleAddObservation = async () => {
    if (!observationContent.trim() || observationContent.length < 5) {
      alert('Observation must be at least 5 characters');
      return;
    }
    try {
      await experimentsAPI.addObservation(uuid, observationContent);
      setShowObservationModal(false);
      setObservationContent('');
      await loadObservations();
    } catch (err) {
      alert(err.message || 'Failed to add observation');
    }
  };

  const handleCancel = async () => {
    try {
      await experimentsAPI.cancelExperiment(uuid);
      setShowCancelModal(false);
      await loadExperiment();
    } catch (err) {
      alert(err.message || 'Failed to cancel experiment');
    }
  };

  const getCurrentPhaseIndex = () => {
    return PHASES.indexOf(experiment?.current_phase);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading experiment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <div className="empty-state-title">Error loading experiment</div>
        <p className="empty-state-text">{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <div className="empty-state-title">Experiment not found</div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xs)' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/')}
            >
              ← Back
            </button>
          </div>
          <h1 className="experiment-title">{experiment.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-xs)' }}>
            <span className={`badge badge-phase-${experiment.current_phase.toLowerCase()}`}>
              {getPhaseDisplay(experiment.current_phase)}
            </span>
            <span className={`badge badge-status-${experiment.status.toLowerCase()}`}>
              {experiment.status}
            </span>
            {experiment.is_overdue && (
              <span className="badge badge-status-overdue">
                Overdue {experiment.days_overdue} days
              </span>
            )}
          </div>
        </div>

        {canModify && experiment.status === 'ACTIVE' && (
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            {experiment.current_phase !== 'FINISHED' && (
              <button
                className="btn btn-primary"
                onClick={() => setShowPhaseModal(true)}
              >
                Change Phase
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => setShowExtendModal(true)}
            >
              Extend Deadline
            </button>
            {experiment.current_phase === 'DECISION_PENDING' && !experiment.decision && (
              <button
                className="btn btn-success"
                onClick={() => setShowDecisionModal(true)}
              >
                Submit Decision
              </button>
            )}
            <button
              className="btn btn-danger"
              onClick={() => setShowCancelModal(true)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Phase Tracker */}
      <div className="phase-tracker">
        {PHASES.map((phase, index) => {
          const isActive = phase === experiment.current_phase;
          const isCompleted = index < getCurrentPhaseIndex();

          return (
            <React.Fragment key={phase}>
              <div className={`phase-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                {getPhaseDisplay(phase)}
              </div>
              {index < PHASES.length - 1 && (
                <span className="phase-arrow">→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <div
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </div>
        <div
          className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline & History
        </div>
        <div
          className={`tab ${activeTab === 'observations' ? 'active' : ''}`}
          onClick={() => setActiveTab('observations')}
        >
          Observations
        </div>
        {experiment.decision && (
          <div
            className={`tab ${activeTab === 'decision' ? 'active' : ''}`}
            onClick={() => setActiveTab('decision')}
          >
            Decision
          </div>
        )}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-2">
          <div className="card">
            <h4 className="card-title">Details</h4>
            <div className="experiment-meta">
              <div className="experiment-meta-item">
                <span className="experiment-meta-label">Experiment Number</span>
                <span className="experiment-meta-value">{experiment.exp_no}</span>
              </div>
              <div className="experiment-meta-item">
                <span className="experiment-meta-label">Owner</span>
                <span className="experiment-meta-value">{experiment.owner_info?.name || 'Unknown'}</span>
              </div>
              <div className="experiment-meta-item">
                <span className="experiment-meta-label">Domain</span>
                <span className="experiment-meta-value">{experiment.domain || 'N/A'}</span>
              </div>
              <div className="experiment-meta-item">
                <span className="experiment-meta-label">Created</span>
                <span className="experiment-meta-value">{formatDateTime(experiment.created_at)}</span>
              </div>
            </div>

            {experiment.assumption_statement && (
              <div style={{ marginTop: 'var(--spacing-lg)' }}>
                <span className="experiment-meta-label">Assumption</span>
                <p style={{ marginTop: 'var(--spacing-xs)' }}>{experiment.assumption_statement}</p>
              </div>
            )}

            {experiment.target_user && (
              <div style={{ marginTop: 'var(--spacing-md)' }}>
                <span className="experiment-meta-label">Target User</span>
                <p style={{ marginTop: 'var(--spacing-xs)' }}>{experiment.target_user}</p>
              </div>
            )}
          </div>

          <div className="card">
            <h4 className="card-title">Deadlines</h4>
            <div className="experiment-meta">
              <div className="experiment-meta-item">
                <span className="experiment-meta-label">Build Deadline</span>
                <span className="experiment-meta-value">
                  {formatDate(experiment.timeline?.build?.extended_deadline || experiment.timeline?.build?.deadline)}
                </span>
              </div>
              <div className="experiment-meta-item">
                <span className="experiment-meta-label">Testing Deadline</span>
                <span className="experiment-meta-value">
                  {formatDate(experiment.timeline?.testing?.extended_deadline || experiment.timeline?.testing?.deadline)}
                </span>
              </div>
              <div className="experiment-meta-item">
                <span className="experiment-meta-label">Decision Deadline</span>
                <span className="experiment-meta-value">
                  {formatDate(experiment.timeline?.decision?.extended_deadline || experiment.timeline?.decision?.deadline)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div>
          <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h4 className="card-title">Phase Timeline</h4>
            <div className="experiment-meta">
              <div className="experiment-meta-item">
                <span className="experiment-meta-label">Build Phase</span>
                <span className="experiment-meta-value">
                  {formatDate(experiment.timeline?.build?.actual_start)} - {formatDate(experiment.timeline?.build?.actual_end)}
                </span>
              </div>
              <div className="experiment-meta-item">
                <span className="experiment-meta-label">Testing Phase</span>
                <span className="experiment-meta-value">
                  {formatDate(experiment.timeline?.testing?.actual_start)} - {formatDate(experiment.timeline?.testing?.actual_end)}
                </span>
              </div>
              <div className="experiment-meta-item">
                <span className="experiment-meta-label">Decision Phase</span>
                <span className="experiment-meta-value">
                  {formatDate(experiment.timeline?.decision?.actual_start)} - {formatDate(experiment.timeline?.decision?.actual_end)}
                </span>
              </div>
            </div>
          </div>

          {experiment.timeline_history?.length > 0 && (
            <div className="card">
              <h4 className="card-title">Timeline History</h4>
              <div style={{ marginTop: 'var(--spacing-md)' }}>
                {experiment.timeline_history.map((entry) => (
                  <div key={entry.uuid} style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--panel-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)' }}>
                      <span style={{ fontWeight: 500 }}>{entry.phase} {entry.field}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {formatDateTime(entry.updated_at)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-xs)' }}>{entry.reason}</p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatDate(entry.old_value)} → {formatDate(entry.new_value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Observations Tab */}
      {activeTab === 'observations' && (
        <div>
          {experiment.status === 'ACTIVE' && (
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowObservationModal(true)}
              >
                Add Observation
              </button>
            </div>
          )}

          {observationsLoading ? (
            <div className="empty-state">
              <div className="loading">
                <span className="spinner" />
                Loading observations...
              </div>
            </div>
          ) : observations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <div className="empty-state-title">No observations yet</div>
              <p className="empty-state-text">Add observations to track your experiment progress</p>
            </div>
          ) : (
            observations.map((obs) => (
              <div key={obs.uuid} className="observation-item">
                <div className="observation-header">
                  <div className="observation-author">
                    <span>{obs.created_by_info?.name || 'Unknown'}</span>
                    <span className={`badge badge-phase-${obs.phase.toLowerCase()}`}>
                      {getPhaseDisplay(obs.phase)}
                    </span>
                  </div>
                  <span className="observation-meta">
                    Day {obs.day_number} • {formatRelativeTime(obs.created_at)}
                  </span>
                </div>
                <div className="observation-content">{obs.content}</div>
                {Object.keys(obs.metrics || {}).length > 0 && (
                  <div style={{ marginTop: 'var(--spacing-sm)', paddingTop: 'var(--spacing-sm)', borderTop: '1px solid var(--panel-border)' }}>
                    {Object.entries(obs.metrics).map(([key, value]) => (
                      <span key={key} style={{ marginRight: 'var(--spacing-md)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{key}:</span>{' '}
                        <strong>{value}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Decision Tab */}
      {activeTab === 'decision' && experiment.decision && (
        <div className="card">
          <h4 className="card-title">Final Decision</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
            <span
              className="badge"
              style={{
                background: `${getDecisionColor(experiment.decision.decision)}33`,
                color: getDecisionColor(experiment.decision.decision),
                fontSize: '1rem',
                padding: 'var(--spacing-sm) var(--spacing-md)',
              }}
            >
              {getDecisionDisplay(experiment.decision.decision)}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              {formatDateTime(experiment.decision.submitted_at)}
            </span>
          </div>
          <p style={{ fontSize: '1rem' }}>{experiment.decision.reason}</p>
          {experiment.decision.overridden_by && (
            <div className="alert alert-warning" style={{ marginTop: 'var(--spacing-md)' }}>
              <strong>Overridden</strong> by admin on {formatDateTime(experiment.decision.overridden_at)}
            </div>
          )}
        </div>
      )}

      {/* Phase Modal */}
      <Modal
        isOpen={showPhaseModal}
        onClose={() => setShowPhaseModal(false)}
        title="Change Phase"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowPhaseModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handlePhaseChange}>
              Update Phase
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">New Phase</label>
          <select
            className="form-select"
            value={newPhase}
            onChange={(e) => setNewPhase(e.target.value)}
          >
            {/* Show all phases but disable invalid ones based on sequential flow */}
            {PHASES.map((phase) => {
              const currentIndex = PHASES.indexOf(experiment?.current_phase);
              const phaseIndex = PHASES.indexOf(phase);
              const isValid = phaseIndex === currentIndex || phaseIndex === currentIndex + 1; // Can stay same or advance by 1
              const isCurrent = phase === experiment?.current_phase;

              if (!isValid && !isAdmin) {
                return null; // Skip invalid phases for non-admins
              }

              return (
                <option key={phase} value={phase} disabled={!isValid}>
                  {getPhaseDisplay(phase)} {isCurrent ? '(Current)' : ''} {!isValid && isAdmin ? '(Blocked)' : ''}
                </option>
              );
            })}
          </select>
          <p className="form-hint">
            Phases must be completed in sequence: Idea → Building → Waiting for Test → User Testing → Decision Pending → Finished
          </p>
        </div>
      </Modal>

      {/* Extend Modal */}
      <Modal
        isOpen={showExtendModal}
        onClose={() => setShowExtendModal(false)}
        title="Extend Deadline"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowExtendModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleExtend}>
              Extend
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Phase</label>
          <select
            className="form-select"
            value={extendPhase}
            onChange={(e) => setExtendPhase(e.target.value)}
          >
            <option value="build">Build</option>
            <option value="testing">Testing</option>
            <option value="decision">Decision</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">New Deadline</label>
          <input
            type="date"
            className="form-input"
            value={extendDate}
            onChange={(e) => setExtendDate(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Reason <span className="required">*</span></label>
          <textarea
            className="form-textarea"
            placeholder="Why is this extension needed?"
            value={extendReason}
            onChange={(e) => setExtendReason(e.target.value)}
          />
        </div>
      </Modal>

      {/* Decision Modal */}
      <Modal
        isOpen={showDecisionModal}
        onClose={() => setShowDecisionModal(false)}
        title="Submit Final Decision"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowDecisionModal(false)}>
              Cancel
            </button>
            <button className="btn btn-success" onClick={handleDecision}>
              Submit Decision
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Decision <span className="required">*</span></label>
          <select
            className="form-select"
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
          >
            <option value="">Select decision...</option>
            <option value="ADD">Add - Continue with this feature</option>
            <option value="DROP">Drop - Discard this experiment</option>
            <option value="ITERATE">Iterate - Run another experiment</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Reason <span className="required">*</span></label>
          <textarea
            className="form-textarea"
            placeholder="Provide detailed reasoning for this decision (min 20 chars)"
            value={decisionReason}
            onChange={(e) => setDecisionReason(e.target.value)}
          />
        </div>
      </Modal>

      {/* Observation Modal */}
      <Modal
        isOpen={showObservationModal}
        onClose={() => setShowObservationModal(false)}
        title="Add Observation"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowObservationModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAddObservation}>
              Add Observation
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Observation <span className="required">*</span></label>
          <textarea
            className="form-textarea"
            placeholder="What did you observe? (min 5 chars)"
            value={observationContent}
            onChange={(e) => setObservationContent(e.target.value)}
          />
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Experiment"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>
              No, Keep Active
            </button>
            <button className="btn btn-danger" onClick={handleCancel}>
              Yes, Cancel
            </button>
          </>
        }
      >
        <p>Are you sure you want to cancel this experiment?</p>
        <p style={{ color: 'var(--text-muted)' }}>This action cannot be undone.</p>
      </Modal>
    </div>
  );
}

export default ExperimentDetail;
