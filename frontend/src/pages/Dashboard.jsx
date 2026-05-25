import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as experimentsAPI from '../api/experiments';
import * as usersAPI from '../api/users';
import { useAuth } from '../context/AuthContext';
import { getPhaseDisplay, getPhaseColor, formatRelativeTime, getStatusColor } from '../utils/format';
import Modal from '../components/Modal';

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [showCustomDomain, setShowCustomDomain] = useState(false);
  const [assumption, setAssumption] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [buildStart, setBuildStart] = useState('');
  const [buildEnd, setBuildEnd] = useState('');
  const [testStart, setTestStart] = useState('');
  const [testEnd, setTestEnd] = useState('');
  const [decisionDeadline, setDecisionDeadline] = useState('');

  // Invite user modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const PREDEFINED_DOMAINS = ['Development', 'Design', 'Engagement', 'Sales'];
  const { isAdmin } = useAuth();

  const loadExperiments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await experimentsAPI.listExperiments(view);
      setExperiments(response.experiments || []);
    } catch (err) {
      setError(err.message || 'Failed to load experiments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExperiments();
  }, [view]);

  useEffect(() => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    setBuildStart(today.toISOString().split('T')[0]);
    setBuildEnd(nextWeek.toISOString().split('T')[0]);
    setTestStart(nextWeek.toISOString().split('T')[0]);
    setTestEnd(twoWeeks.toISOString().split('T')[0]);
    setDecisionDeadline(twoWeeks.toISOString().split('T')[0]);
  }, []);

  const stats = {
    total: experiments.length,
    active: experiments.filter(e => e.status === 'ACTIVE').length,
    overdue: experiments.filter(e => e.is_overdue).length,
    completed: experiments.filter(e => e.status === 'COMPLETED').length,
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);

    try {
      await experimentsAPI.createExperiment({
        title,
        domain,
        assumption_statement: assumption,
        target_user: targetUser,
        timeline: {
          build: {
            planned_start: buildStart,
            planned_end: buildEnd,
            deadline: buildEnd,
          },
          testing: {
            planned_start: testStart,
            planned_end: testEnd,
            deadline: testEnd,
          },
          decision: {
            deadline: decisionDeadline,
          },
        },
      });

      setShowCreateModal(false);
      resetForm();
      await loadExperiments();
    } catch (err) {
      setCreateError(err.message || 'Failed to create experiment');
    } finally {
      setCreateLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDomain('');
    setCustomDomain('');
    setShowCustomDomain(false);
    setAssumption('');
    setTargetUser('');
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    setBuildStart(today.toISOString().split('T')[0]);
    setBuildEnd(nextWeek.toISOString().split('T')[0]);
    setTestStart(nextWeek.toISOString().split('T')[0]);
    setTestEnd(twoWeeks.toISOString().split('T')[0]);
    setDecisionDeadline(twoWeeks.toISOString().split('T')[0]);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess(false);
    setInviteLoading(true);

    try {
      await usersAPI.inviteUser(inviteEmail, inviteName, inviteRole);
      setInviteSuccess(true);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('MEMBER');
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccess(false);
      }, 2000);
    } catch (err) {
      setInviteError(err.message || 'Failed to invite user');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDomainChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setShowCustomDomain(true);
      setDomain('');
    } else {
      setShowCustomDomain(false);
      setDomain(value);
      setCustomDomain('');
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Experiments</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 'var(--spacing-xs)' }}>
            Manage your experiments
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          {isAdmin && (
            <button
              className="btn btn-secondary"
              onClick={() => setShowInviteModal(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
              Invite User
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Experiment
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Experiments</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.overdue}</div>
          <div className="stat-label">Overdue</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.completed}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="tabs">
        <div
          className={`tab ${view === 'all' ? 'active' : ''}`}
          onClick={() => setView('all')}
        >
          All Experiments
        </div>
        <div
          className={`tab ${view === 'active' ? 'active' : ''}`}
          onClick={() => setView('active')}
        >
          Active
        </div>
        <div
          className={`tab ${view === 'my' ? 'active' : ''}`}
          onClick={() => setView('my')}
        >
          My Experiments
        </div>
      </div>

      {loading && (
        <div className="empty-state">
          <div className="loading" style={{ fontSize: '1.5rem' }}>
            <span className="spinner"></span>
            Loading experiments...
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {!loading && !error && experiments.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No experiments yet</div>
          <p className="empty-state-text">Create your first experiment to get started</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create Experiment
          </button>
        </div>
      )}

      {!loading && !error && experiments.length > 0 && (
        <div className="grid grid-3">
          {experiments.map((exp) => {
            const phaseDisplay = getPhaseDisplay(exp.current_phase);
            const isOverdue = exp.is_overdue;
            const isOwner = exp.owner === user?.uuid;

            return (
              <div
                key={exp.uuid}
                className="card animate-fade-in"
                onClick={() => navigate(`/experiment/${exp.uuid}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                      <span className={`badge badge-${isOverdue ? 'status-overdue' : `phase-${exp.current_phase.toLowerCase()}`}`}>
                        {phaseDisplay}
                      </span>
                      <span className={`badge badge-status-${exp.status.toLowerCase()}`}>
                        {exp.status}
                      </span>
                    </div>
                    <h4 className="card-title">{exp.title}</h4>
                    <p className="card-subtitle">{exp.exp_no}{exp.domain ? ` • ${exp.domain}` : ''}</p>
                  </div>
                </div>
                <div className="card-body">
                  {exp.assumption_statement && (
                    <p>{exp.assumption_statement.substring(0, 100)}{exp.assumption_statement.length > 100 ? '...' : ''}</p>
                  )}
                </div>
                <div className="card-footer">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {isOwner ? 'You' : (exp.owner_info?.name || 'Unknown')} • {formatRelativeTime(exp.created_at)}
                  </span>
                  {isOverdue && (
                    <span style={{ color: 'var(--status-overdue)', fontSize: '0.75rem', fontWeight: 500 }}>
                      Overdue {exp.days_overdue} days
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Experiment"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createLoading}
              onClick={handleCreate}
            >
              {createLoading ? (
                <>
                  <span className="spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                  Creating...
                </>
              ) : (
                'Create Experiment'
              )}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Title <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., New Feature Onboarding"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Domain</label>
            <select
              className="form-select"
              value={showCustomDomain ? 'custom' : domain}
              onChange={handleDomainChange}
            >
              <option value="">Select domain...</option>
              {PREDEFINED_DOMAINS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
              <option value="custom">+ Add Custom Domain</option>
            </select>
            {showCustomDomain && (
              <input
                type="text"
                className="form-input"
                style={{ marginTop: 'var(--spacing-sm)' }}
                placeholder="Enter custom domain"
                value={customDomain}
                onChange={(e) => {
                  setCustomDomain(e.target.value);
                  setDomain(e.target.value);
                }}
              />
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Assumption Statement</label>
            <textarea
              className="form-textarea"
              placeholder="What are you assuming will happen?"
              value={assumption}
              onChange={(e) => setAssumption(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target User</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Premium subscribers, New users"
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
            />
          </div>

          <div className="grid grid-2" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div className="form-group">
              <label className="form-label">Build Start</label>
              <input
                type="date"
                className="form-input"
                value={buildStart}
                onChange={(e) => setBuildStart(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Build Deadline</label>
              <input
                type="date"
                className="form-input"
                value={buildEnd}
                onChange={(e) => setBuildEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-2" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div className="form-group">
              <label className="form-label">Testing Start</label>
              <input
                type="date"
                className="form-input"
                value={testStart}
                onChange={(e) => setTestStart(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Testing Deadline</label>
              <input
                type="date"
                className="form-input"
                value={testEnd}
                onChange={(e) => setTestEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Decision Deadline</label>
            <input
              type="date"
              className="form-input"
              value={decisionDeadline}
              onChange={(e) => setDecisionDeadline(e.target.value)}
            />
          </div>

          {createError && (
            <div className="alert alert-error">{createError}</div>
          )}
        </form>
      </Modal>

      {/* Invite User Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setInviteError('');
          setInviteSuccess(false);
        }}
        title="Invite New User"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowInviteModal(false);
                setInviteError('');
                setInviteSuccess(false);
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={inviteLoading}
              onClick={handleInvite}
            >
              {inviteLoading ? (
                <>
                  <span className="spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </button>
          </>
        }
      >
        <form onSubmit={handleInvite}>
          {inviteSuccess && (
            <div className="alert alert-success" style={{ marginBottom: 'var(--spacing-md)' }}>
              Invitation sent successfully!
            </div>
          )}
          {inviteError && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-md)' }}>
              {inviteError}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Name <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter user's full name"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email <span className="required">*</span></label>
            <input
              type="email"
              className="form-input"
              placeholder="Enter user's email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              className="form-select"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <p className="form-hint">Members can create and manage their own experiments. Admins can manage all experiments and invite users.</p>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Dashboard;
