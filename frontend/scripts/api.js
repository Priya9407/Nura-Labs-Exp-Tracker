/**
 * API Client for Experiment Platform
 */

const API_BASE_URL = '/api';

// Helper to handle fetch responses
async function handleResponse(response) {
  const data = await response.json();

  if (!data.success) {
    const error = new Error(data.error?.message || 'An error occurred');
    error.code = data.error?.code;
    error.status = response.status;
    throw error;
  }

  return data;
}

// Auth API
const authAPI = {
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  async logout() {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse(response);
  },

  async getMe() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// Users API
const usersAPI = {
  async invite(email, name, role = 'MEMBER') {
    const response = await fetch(`${API_BASE_URL}/users/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, name, role }),
    });
    return handleResponse(response);
  },

  async activate(token, password) {
    const response = await fetch(`${API_BASE_URL}/users/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password }),
    });
    return handleResponse(response);
  },

  async list() {
    const response = await fetch(`${API_BASE_URL}/users`, {
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// Experiments API
const experimentsAPI = {
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/experiments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async list(view = 'all') {
    const response = await fetch(`${API_BASE_URL}/experiments?view=${view}`, {
      credentials: 'include',
    });
    return handleResponse(response);
  },

  async get(uuid) {
    const response = await fetch(`${API_BASE_URL}/experiments/${uuid}`, {
      credentials: 'include',
    });
    return handleResponse(response);
  },

  async update(uuid, data) {
    const response = await fetch(`${API_BASE_URL}/experiments/${uuid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async delete(uuid) {
    const response = await fetch(`${API_BASE_URL}/experiments/${uuid}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse(response);
  },

  async cancel(uuid) {
    const response = await fetch(`${API_BASE_URL}/experiments/${uuid}/cancel`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse(response);
  },

  async updatePhase(uuid, phase, actualStart = null) {
    const response = await fetch(`${API_BASE_URL}/experiments/${uuid}/phase`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ phase, actual_start: actualStart }),
    });
    return handleResponse(response);
  },

  async extendDeadline(uuid, phase, newDeadline, reason) {
    const response = await fetch(`${API_BASE_URL}/experiments/${uuid}/extend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ phase, new_deadline: newDeadline, reason }),
    });
    return handleResponse(response);
  },
};

// Observations API
const observationsAPI = {
  async create(uuid, content, metrics = {}) {
    const response = await fetch(`${API_BASE_URL}/experiments/${uuid}/observations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ content, metrics }),
    });
    return handleResponse(response);
  },

  async list(uuid) {
    const response = await fetch(`${API_BASE_URL}/experiments/${uuid}/observations`, {
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// Decisions API
const decisionsAPI = {
  async submit(uuid, decision, reason) {
    const response = await fetch(`${API_BASE_URL}/experiments/${uuid}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ decision, reason }),
    });
    return handleResponse(response);
  },

  async override(uuid, decision, reason) {
    const response = await fetch(`${API_BASE_URL}/experiments/${uuid}/decision/override`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ decision, reason }),
    });
    return handleResponse(response);
  },
};

// Utility functions
const utils = {
  formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  },

  formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  formatRelativeTime(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 30) {
      return this.formatDate(dateStr);
    } else if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  },

  getPhaseColor(phase) {
    const colors = {
      IDEA: 'var(--phase-idea)',
      BUILDING: 'var(--phase-building)',
      WAITING_FOR_TEST: 'var(--phase-waiting)',
      USER_TESTING: 'var(--phase-testing)',
      DECISION_PENDING: 'var(--phase-decision)',
      FINISHED: 'var(--phase-finished)',
    };
    return colors[phase] || 'var(--text-muted)';
  },

  getPhaseDisplay(phase) {
    const displays = {
      IDEA: 'Idea',
      BUILDING: 'Building',
      WAITING_FOR_TEST: 'Waiting for Test',
      USER_TESTING: 'User Testing',
      DECISION_PENDING: 'Decision Pending',
      FINISHED: 'Finished',
    };
    return displays[phase] || phase;
  },

  getStatusColor(status) {
    const colors = {
      ACTIVE: 'var(--status-active)',
      COMPLETED: 'var(--status-completed)',
      ARCHIVED: 'var(--status-archived)',
      CANCELLED: 'var(--status-cancelled)',
    };
    return colors[status] || 'var(--text-muted)';
  },

  getDecisionColor(decision) {
    const colors = {
      ADD: 'var(--decision-add)',
      DROP: 'var(--decision-drop)',
      ITERATE: 'var(--decision-iterate)',
    };
    return colors[decision] || 'var(--text-muted)';
  },

  getDecisionDisplay(decision) {
    const displays = {
      ADD: 'Add',
      DROP: 'Drop',
      ITERATE: 'Iterate',
    };
    return displays[decision] || decision;
  },
};

// Check authentication status
async function checkAuth() {
  try {
    const data = await authAPI.getMe();
    return data.user;
  } catch (error) {
    return null;
  }
}

// Redirect to login if not authenticated
async function requireAuth() {
  const user = await checkAuth();
  if (!user) {
    window.location.href = '/login';
    return null;
  }
  return user;
}

window.API = {
  auth: authAPI,
  users: usersAPI,
  experiments: experimentsAPI,
  observations: observationsAPI,
  decisions: decisionsAPI,
  utils,
  checkAuth,
  requireAuth,
};
