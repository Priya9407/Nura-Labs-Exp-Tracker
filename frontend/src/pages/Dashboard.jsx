import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as experimentsAPI from '../api/experiments';
import * as usersAPI from '../api/users';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/ui/StatCard';
import ExperimentCard from '../components/ui/ExperimentCard';
import ActivityFeed from '../components/ui/ActivityFeed';
import AlertBanner from '../components/ui/AlertBanner';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Modal from '../components/Modal';
import { SkeletonStatCard, SkeletonCard } from '../components/ui/LoadingSkeleton';
import { getPhaseDisplay, getStatusDisplay } from '../utils/format';

// Inline SVG Icons
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const FlaskIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 3L7 17a2 2 0 002 2h6a2 2 0 002-2L15 3" />
    <path d="M6 3h12" />
  </svg>
);

const ClockIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const AlertCircleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);

const CheckCircleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const ChevronRightIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const TrendingUpIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M7 17L17 7M17 7H7M17 7V17" />
  </svg>
);

const CalendarIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const XIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [allActivities, setAllActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [activityFilterDate, setActivityFilterDate] = useState('');
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [selectedDateGroup, setSelectedDateGroup] = useState(null);

  // Form state
  const [form, setForm] = useState({
    title: '',
    domain: '',
    assumption: '',
    targetUsers: [],
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const PREDEFINED_DOMAINS = ['Development', 'Design', 'Marketing', 'Sales', 'Research'];
  const PREDEFINED_TARGET_USERS = [
    'New Customers', 'Existing Customers', 'Premium Users', 'Free Users',
    'Mobile Users', 'Desktop Users', 'Young Adults', 'Seniors', 'Students', 'Working Professionals'
  ];

  // Track loading state with ref to prevent re-fetching
  const hasLoadedRef = useRef(false);

  // Get activity description - defined before loadActivities
  const getActivityDescription = useCallback((activity) => {
    if (!activity) return 'Unknown activity';
    const type = activity.activity_type;
    const details = activity.details || {};
    switch (type) {
      case 'experiment_created':
        return `created experiment "${details.title || ''}"`;
      case 'phase_changed':
        return `moved from ${getPhaseDisplay(details.from)} to ${getPhaseDisplay(details.to)}`;
      case 'testing_started':
        return `started testing (${details.duration_days} days)`;
      case 'observation_submitted':
        return `submitted observation for Day ${details.day_number}`;
      case 'observation_edited':
        return `edited observation for Day ${details.day_number}`;
      case 'decision_submitted':
        return `submitted ${details.decision} decision`;
      case 'iteration_created':
        return `created iteration ${details.iteration_no}`;
      default:
        return type ? type.replace(/_/g, ' ') : 'Unknown activity';
    }
  }, []);

  // Single useEffect to load all data once when user is available
  useEffect(() => {
    if (hasLoadedRef.current || !user?.uuid) return;
    hasLoadedRef.current = true;

    const loadAllData = async () => {
      setLoading(true);
      setError('');

      try {
        // Load experiments
        const expResponse = await experimentsAPI.listExperiments('my');
        const experimentsList = (expResponse?.experiments || []).filter(
          exp => exp?.owner === user?.uuid && exp?.status === 'ACTIVE'
        );
        setExperiments(experimentsList);
      } catch (err) {
        setError(err?.message || 'Failed to load experiments');
        setExperiments([]);
      } finally {
        setLoading(false);
      }

      // Load activities (non-blocking)
      try {
        const actResponse = await experimentsAPI.getRecentActivities(100);

        const rawActivities = actResponse?.activities || [];
        const activities = rawActivities.map(a => ({
          id: a?.uuid || 'unknown',
          action_type: a?.activity_type || 'unknown',
          description: getActivityDescription(a),
          actor_name: a?.user_name || 'Unknown',
          timestamp: a?.created_at || new Date().toISOString(),
          experiment_title: a?.experiment_title || '',
        }));

        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setAllActivities(activities);
        setFilteredActivities(activities.slice(0, 3));
        console.log("Loaded activities:", allActivities);
      } catch (err) {
        console.error('Failed to load activities:', err);
        setAllActivities([]);
        setFilteredActivities([]);
      }
    };

    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uuid]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim()) {
      setFormError('Title is required');
      return;
    }
    setFormLoading(true);
    try {
      await experimentsAPI.createExperiment({
        title: form.title,
        domain: form.domain,
        assumption_statement: form.assumption,
        target_user: form.targetUsers.join(', '),
      });
      setShowCreateModal(false);
      setForm({ title: '', domain: '', assumption: '', targetUsers: [] });
      await loadExperiments();
    } catch (err) {
      setFormError(err.message || 'Failed to create experiment');
    } finally {
      setFormLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    if (!inviteEmail.trim() || !inviteName.trim()) {
      setInviteError('Email and name are required');
      return;
    }
    setInviteLoading(true);
    try {
      await usersAPI.inviteUser(inviteEmail, inviteName, inviteRole);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('MEMBER');
      setTimeout(() => setShowInviteModal(false), 1500);
    } catch (err) {
      setInviteError(err.message || 'Failed to invite user');
    } finally {
      setInviteLoading(false);
    }
  };

  const stats = {
    total: experiments.length,
    active: experiments.filter(e => e.status === 'ACTIVE').length,
    inBuild: experiments.filter(e => e.current_phase === 'BUILDING').length,
    inTesting: experiments.filter(e => e.current_phase === 'TESTING').length,
    pendingDecision: experiments.filter(e => e.current_phase === 'DECISION').length,
    overdue: experiments.filter(e => e.phase_progress?.is_overdue).length,
  };

  const overdueExperiments = experiments.filter(e => e.phase_progress?.is_overdue);
  const myActiveExperiments = experiments.slice(0, 6);

  const formInputStyles = {
    width: '100%',
    padding: '12px 16px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };

  const formLabelStyles = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-primary)',
    marginBottom: '8px',
  };

  const formTextareaStyles = {
    ...formInputStyles,
    minHeight: '100px',
    resize: 'vertical',
    fontFamily: 'inherit',
  };

  const formSelectStyles = {
    ...formInputStyles,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A7A7A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
    paddingRight: '40px',
  };

  return (
    <>
      <style>{responsiveStyles}</style>
      <div className="dashboard-container">
        {/* Welcome Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="welcome-title">
              Welcome back, {user?.name?.split(' ')[0] || 'User'}
            </h1>
            <p className="welcome-subtitle">
              Here's what's happening with your experiments
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {isAdmin && (
              <Button variant="secondary" onClick={() => setShowInviteModal(true)}>
                Invite User
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid - Minimal */}
        {loading ? (
          <div className="stats-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>
        ) : (
          <div className="stats-grid">
            <StatCard
              title="Total"
              value={stats.total}
              icon={FlaskIcon}
            />
            <StatCard
              title="Active"
              value={stats.active}
              icon={CheckCircleIcon}
            />
            <StatCard
              title="Building"
              value={stats.inBuild}
              icon={ClockIcon}
            />
            <StatCard
              title="Testing"
              value={stats.inTesting}
              icon={FlaskIcon}
            />
            <StatCard
              title="Decisions"
              value={stats.pendingDecision}
              icon={AlertCircleIcon}
            />
            <StatCard
              title="Overdue"
              value={stats.overdue}
              color="red"
              icon={AlertCircleIcon}
            />
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <AlertBanner variant="error" onClose={() => setError('')}>
            {error}
          </AlertBanner>
        )}

        {/* Overdue Alert */}
        {overdueExperiments.length > 0 && (
          <AlertBanner variant="warning" title="Overdue Items">
            You have {overdueExperiments.length} experiment{overdueExperiments.length > 1 ? 's' : ''} with overdue deadlines.
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {overdueExperiments.slice(0, 3).map(exp => (
                <button
                  key={exp.uuid}
                  onClick={() => navigate(`/experiment/${exp.uuid}`)}
                  className="overdue-link"
                >
                  {exp.title}
                </button>
              ))}
            </div>
          </AlertBanner>
        )}

        {/* Main Content Grid */}
        <div className="main-grid">
          {/* My Experiments */}
          <div>
            <div className="section-header">
              <h2 className="section-title">My Active Experiments</h2>
              <button
                onClick={() => navigate('/experiments')}
                className="link-button"
              >
                View all <ChevronRightIcon />
              </button>
            </div>

            {loading ? (
              <div className="experiments-grid">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : myActiveExperiments.length === 0 ? (
              <EmptyState
                icon={FlaskIcon}
                title="No active experiments"
                description="You don't have any active experiments. Create one to get started!"
                actionLabel="Create Experiment"
                onAction={() => setShowCreateModal(true)}
              />
            ) : (
              <div className="experiments-grid">
                {myActiveExperiments.map(exp => (
                  <ExperimentCard key={exp.uuid} experiment={exp} currentUser={user} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Section */}
          <div className="sidebar-section">
            {/* Activity Feed */}
            <div className="activity-card" style={{ minHeight: '200px' }}>
              <div className="section-header" style={{ marginBottom: '16px' }}>
                <h2 className="section-title">Recent Activity</h2>
                <button
                  onClick={() => { setShowAllActivities(true) }}
                  className="link-button"
                >
                  View all
                </button>
              </div>
              <div style={{ minHeight: '200px' }}>
                <ActivityFeed
                  activities={filteredActivities}
                  allActivities={allActivities}
                  emptyMessage="No recent activity"
                  showDateHeaders={false}
                />
              </div>
            </div>

            {/* Quick Links */}
            <div className="quick-links-card">
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
                Quick Links
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => navigate('/experiments?view=my')}
                  className="quick-link"
                >
                  <FlaskIcon size={18} />
                  My Experiments
                  <ChevronRightIcon size={14} />
                </button>
                <button
                  onClick={() => navigate('/experiments?overdue=true')}
                  className="quick-link"
                >
                  <AlertCircleIcon size={18} />
                  Overdue Items
                  {stats.overdue > 0 && <span className="badge">{stats.overdue}</span>}
                </button>
                <button
                  onClick={() => navigate('/experiments?phase=TESTING')}
                  className="quick-link"
                >
                  <ClockIcon size={18} />
                  Active Testing
                  <ChevronRightIcon size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Create Experiment Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setFormError('');
          }}
          title="Create New Experiment"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreate} loading={formLoading}>
                Create
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {formError && (
              <AlertBanner variant="error" onClose={() => setFormError('')}>
                {formError}
              </AlertBanner>
            )}
            <div>
              <label style={formLabelStyles}>
                Title <span style={{ color: 'var(--accent-coral)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={formInputStyles}
                placeholder="e.g., New Feature Onboarding"
              />
            </div>
            <div>
              <label style={formLabelStyles}>Domain</label>
              <select
                className="form-select"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                style={formSelectStyles}
              >
                <option value="">Select domain...</option>
                {PREDEFINED_DOMAINS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={formLabelStyles}>Assumption Statement</label>
              <textarea
                className="form-textarea"
                value={form.assumption}
                onChange={(e) => setForm({ ...form, assumption: e.target.value })}
                style={formTextareaStyles}
                placeholder="What are you assuming will happen?"
              />
            </div>
            <div style={{ padding: '16px', background: 'var(--accent-teal-light)', borderRadius: '12px', fontSize: '13px', color: 'var(--accent-teal)' }}>
              <strong>Next step:</strong> Click "Start Building" after creation to generate timeline.
            </div>
          </form>
        </Modal>

        {/* Invite Modal */}
        <Modal
          isOpen={showInviteModal}
          onClose={() => {
            setShowInviteModal(false);
            setInviteError('');
          }}
          title="Invite Team Member"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowInviteModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleInvite} loading={inviteLoading}>
                Send Invitation
              </Button>
            </>
          }
        >
          <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {inviteError && (
              <AlertBanner variant="error" onClose={() => setInviteError('')}>
                {inviteError}
              </AlertBanner>
            )}
            <div>
              <label style={formLabelStyles}>
                Name <span style={{ color: 'var(--accent-coral)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                style={formInputStyles}
                placeholder="Full name"
              />
            </div>
            <div>
              <label style={formLabelStyles}>
                Email <span style={{ color: 'var(--accent-coral)' }}>*</span>
              </label>
              <input
                type="email"
                className="form-input"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={formInputStyles}
                placeholder="email@company.com"
              />
            </div>
            <div>
              <label style={formLabelStyles}>Role</label>
              <select
                className="form-select"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                style={formSelectStyles}
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </form>
        </Modal>

        {/* View All Activities Modal */}
        <Modal
          isOpen={showAllActivities}
          onClose={() => { setShowAllActivities(false); setActivityFilterDate(''); setSelectedDateGroup(null); }}
          title="Activity Log"
          size="large"
          footer={
            <Button variant="ghost" onClick={() => { setShowAllActivities(false); setActivityFilterDate(''); setSelectedDateGroup(null); }}>
              Close
            </Button>
          }
        >
          <ActivityLogWithFilter
            activities={allActivities}
            activityFilterDate={activityFilterDate}
            setActivityFilterDate={setActivityFilterDate}
            selectedDateGroup={selectedDateGroup}
            setSelectedDateGroup={setSelectedDateGroup}
          />
        </Modal>
      </div>
    </>
  );
};

// Activity Log Filter Component
function ActivityLogWithFilter({ activities, activityFilterDate, setActivityFilterDate, selectedDateGroup, setSelectedDateGroup }) {
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'today', 'yesterday', 'custom'

  // Check if we have activities for specific dates
  const today = new Date();
  const todayStr = today.toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const hasTodayActivities = activities?.some(a => new Date(a.timestamp).toDateString() === todayStr);
  const hasYesterdayActivities = activities?.some(a => new Date(a.timestamp).toDateString() === yesterdayStr);

  // Filter activities based on selection
  useEffect(() => {
    if (!activities || activities.length === 0) {
      setFilteredActivities([]);
      return;
    }

    if (activityFilterDate) {
      const filtered = activities.filter(a =>
        new Date(a.timestamp).toDateString() === new Date(activityFilterDate).toDateString()
      );
      setFilteredActivities(filtered);
      setActiveFilter('custom');
    } else if (selectedDateGroup) {
      const filtered = activities.filter(a =>
        new Date(a.timestamp).toDateString() === selectedDateGroup
      );
      setFilteredActivities(filtered);
      setActiveFilter('custom');
    } else if (activeFilter === 'today') {
      const todayActivities = activities.filter(a =>
        new Date(a.timestamp).toDateString() === todayStr
      );
      setFilteredActivities(todayActivities);
    } else if (activeFilter === 'yesterday') {
      const yesterdayActivities = activities.filter(a =>
        new Date(a.timestamp).toDateString() === yesterdayStr
      );
      setFilteredActivities(yesterdayActivities);
    } else {
      setFilteredActivities(activities);
    }
  }, [activities, activityFilterDate, selectedDateGroup, activeFilter]);

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const uniqueDates = [...new Set(activities.map(a => new Date(a.timestamp).toDateString()))]
    .sort((a, b) => new Date(b) - new Date(a));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Clean Header with Filter Tabs */}
      <div style={activityLogStyles.header}>
        {/* Tab Filters */}
        <div style={activityLogStyles.tabContainer}>
          <button
            onClick={() => {
              setActiveFilter('all');
              setActivityFilterDate('');
              setSelectedDateGroup(null);
            }}
            style={{
              ...activityLogStyles.tab,
              ...(activeFilter === 'all' ? activityLogStyles.tabActive : {})
            }}
          >
            All Time
          </button>
          <button
            onClick={() => {
              setActiveFilter('today');
              setActivityFilterDate('');
              setSelectedDateGroup(null);
            }}
            style={{
              ...activityLogStyles.tab,
              ...(activeFilter === 'today' ? activityLogStyles.tabActive : {})
            }}
          >
            Today
          </button>
          <button
            onClick={() => {
              setActiveFilter('yesterday');
              setActivityFilterDate('');
              setSelectedDateGroup(null);
            }}
            style={{
              ...activityLogStyles.tab,
              ...(activeFilter === 'yesterday' ? activityLogStyles.tabActive : {})
            }}
          >
            Yesterday
          </button>
        </div>

        {/* Date Picker */}
        <div style={activityLogStyles.datePickerWrapper}>
          <CalendarIcon size={16} />
          <input
            type="date"
            value={activityFilterDate}
            onChange={(e) => {
              setActivityFilterDate(e.target.value);
              setSelectedDateGroup(null);
              setActiveFilter('custom');
            }}
            style={activityLogStyles.dateInput}
          />
          {(activityFilterDate || selectedDateGroup) && (
            <button
              onClick={() => {
                setActivityFilterDate('');
                setSelectedDateGroup(null);
                setActiveFilter('today');
              }}
              style={activityLogStyles.clearButton}
            >
              <XIcon size={12} />
            </button>
          )}
        </div>
      </div>



      {/* Results Header */}
      <div style={activityLogStyles.resultsHeader}>
        <span style={activityLogStyles.resultsCount}>
          {filteredActivities.length} activity{filteredActivities.length !== 1 ? 'ies' : 'y'}
        </span>
        {(activeFilter === 'custom' && (activityFilterDate || selectedDateGroup)) ? (
          <span style={activityLogStyles.resultsDate}>
            {formatDisplayDate(activityFilterDate || selectedDateGroup)}
          </span>
        ) : activeFilter === 'today' ? (
          <span style={activityLogStyles.resultsDate}>Today</span>
        ) : activeFilter === 'yesterday' ? (
          <span style={activityLogStyles.resultsDate}>Yesterday</span>
        ) : null}
      </div>

      {/* Activity Feed */}
      <div style={activityLogStyles.feedContainer}>
        <ActivityFeed
          activities={filteredActivities}
          allActivities={activities}
          emptyMessage="No activities found"
          showDateHeaders={activeFilter === 'all'}
        />
      </div>
    </div>
  );
}

const activityLogStyles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--border)',
  },
  tabContainer: {
    display: 'flex',
    gap: '4px',
    flex: 1,
  },
  tab: {
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tabActive: {
    color: 'var(--accent-coral)',
    background: 'var(--accent-coral-light)',
  },
  datePickerWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    background: 'var(--bg-surface-alt)',
    borderRadius: '8px',
    border: '1px solid var(--border)',
  },
  dateInput: {
    border: 'none',
    background: 'transparent',
    fontSize: '13px',
    color: 'var(--text-primary)',
    outline: 'none',
    cursor: 'pointer',
    width: '100px',
  },
  clearButton: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  pill: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    background: 'var(--bg-surface-alt)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  pillActive: {
    background: 'var(--accent-coral)',
    color: 'white',
    borderColor: 'var(--accent-coral)',
  },
  resultsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid var(--border)',
  },
  resultsCount: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  resultsDate: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  feedContainer: {
    minHeight: '350px',
    maxHeight: '450px',
    overflowY: 'auto',
    paddingRight: '8px',
  },
};

// Responsive styles for filter
const filterResponsiveStyles = `
  @media (max-width: 640px) {
    .activity-filter-container {
      padding: 12px 16px !important;
      gap: 12px !important;
    }
    .activity-filter-presets {
      flex-wrap: wrap;
    }
    .activity-filter-pills {
      max-height: 80px;
      overflow-x: auto;
      flex-wrap: nowrap;
      -webkit-overflow-scrolling: touch;
    }
  }
`;

const responsiveStyles = `
  .dashboard-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding-top: 12px;
  }

  .form-input:focus, .form-select:focus, .form-textarea:focus {
    border-color: var(--accent-coral) !important;
    box-shadow: 0 0 0 3px var(--accent-coral-light);
  }

  .dashboard-header {
    display: flex;
    flex-direction: column;
  }

  @media (min-width: 640px) {
    .dashboard-header {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  @media (min-width: 480px) {
    .stats-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (min-width: 768px) {
    .stats-grid {
      grid-template-columns: repeat(6, 1fr);
      gap: 16px;
    }
  }

  .main-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
  }

  @media (min-width: 1024px) {
    .main-grid {
      grid-template-columns: 1.5fr 1fr;
    }
  }

  .experiments-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  @media (min-width: 640px) {
    .experiments-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .sidebar-section {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .quick-links-card {
    background: var(--bg-surface);
    border-radius: 16px;
    border: 1px solid var(--border);
    padding: 20px;
  }

  .activity-card {
    background: var(--bg-surface);
    border-radius: 16px;
    border: 1px solid var(--border);
    padding: 20px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin-top: 0;
  }

  .link-button {
    font-size: 14px;
    color: var(--accent-coral);
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    font-weight: 500;
    transition: opacity 0.15s ease;
  }

  .link-button:hover {
    opacity: 0.8;
  }

  .quick-link {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    font-size: 14px;
    color: var(--text-secondary);
    background: none;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .quick-link:hover {
    background: var(--bg-highlight);
  }

  .badge {
    margin-left: auto;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 600;
    background: var(--accent-coral);
    color: white;
    border-radius: 20px;
  }

  .overdue-link {
    font-size: 13px;
    font-weight: 500;
    color: var(--accent-orange);
    text-decoration: underline;
    cursor: pointer;
    background: none;
    border: none;
    padding: 6px 10px;
    border-radius: 6px;
    transition: background 0.15s ease;
  }

  .overdue-link:hover {
    background: var(--accent-orange-light);
  }

  .welcome-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.2;
  }

  .welcome-subtitle {
    font-size: 13px;
    color: var(--text-muted);
    margin: 2px 0 0;
  }
`;

export default Dashboard;
