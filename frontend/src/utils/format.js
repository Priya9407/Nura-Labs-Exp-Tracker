export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function addDaysToDate(dateStr, days) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) {
    return formatDate(dateStr);
  } else if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return 'Just now';
  }
}

export function getPhaseDisplay(phase) {
  if (!phase) return 'Unknown';
  const displays = {
    IDEA: 'Idea',
    BUILDING: 'Building',
    TESTING: 'Testing',
    DECISION: 'Decision',
    COMPLETED: 'Completed',
    WAITING_FOR_TEST: 'Waiting for Test',
    USER_TESTING: 'User Testing',
    DECISION_PENDING: 'Decision Pending',
    FINISHED: 'Finished',
  };
  return displays[phase] || phase;
}

export function getStatusDisplay(status) {
  const displays = {
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    ARCHIVED: 'Archived',
    CANCELLED: 'Cancelled',
  };
  return displays[status] || status;
}

export function getDecisionDisplay(decision) {
  const displays = {
    ADD: 'Add',
    DROP: 'Drop',
    ITERATE: 'Iterate',
  };
  return displays[decision] || decision;
}

export function getPhaseColor(phase) {
  const colors = {
    IDEA: 'var(--phase-idea)',
    BUILDING: 'var(--phase-building)',
    TESTING: 'var(--phase-testing)',
    DECISION: 'var(--phase-decision)',
    COMPLETED: 'var(--phase-finished)',
    WAITING_FOR_TEST: 'var(--phase-waiting)',
    USER_TESTING: 'var(--phase-testing)',
    DECISION_PENDING: 'var(--phase-decision)',
    FINISHED: 'var(--phase-finished)',
  };
  return colors[phase] || 'var(--text-muted)';
}

export function getDecisionColor(decision) {
  const colors = {
    ADD: 'var(--decision-add)',
    DROP: 'var(--decision-drop)',
    ITERATE: 'var(--decision-iterate)',
  };
  return colors[decision] || 'var(--text-muted)';
}

export function getStatusColor(status) {
  const colors = {
    ACTIVE: 'var(--status-active)',
    COMPLETED: 'var(--status-completed)',
    ARCHIVED: 'var(--status-archived)',
    CANCELLED: 'var(--status-cancelled)',
  };
  return colors[status] || 'var(--text-muted)';
}

export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
