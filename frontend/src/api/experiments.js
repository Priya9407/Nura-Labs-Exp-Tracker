import { get, post } from './client';

// Experiments
export async function createExperiment(data) {
  return post('/experiments', data);
}

export async function listExperiments(view = 'active', filters = {}) {
  const params = new URLSearchParams({ view });
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return get(`/experiments?${params.toString()}`);
}

export async function getExperiment(uuid) {
  return get(`/experiments/${uuid}`);
}

export async function getRelatedExperiments(rootUuid) {
  return get(`/experiments?root_uuid=${rootUuid}`);
}

export async function listIterations(uuid) {
  const response = await getRelatedExperiments(uuid);
  return {
    ...response,
    iterations: response.experiments || [],
  };
}

// Phase Actions
export async function startBuild(uuid) {
  return post(`/experiments/${uuid}/start-build`, {});
}

export async function completeBuild(uuid) {
  return post(`/experiments/${uuid}/complete-build`, {});
}

export async function startTesting(uuid, durationDays = 4) {
  return post(`/experiments/${uuid}/start-testing`, { duration_days: durationDays });
}

export async function completeTesting(uuid) {
  return post(`/experiments/${uuid}/complete-testing`, {});
}

export async function submitDecision(uuid, decision, reason) {
  return post(`/experiments/${uuid}/submit-decision`, { decision, reason });
}

export async function extendDeadline(uuid, phase, newDeadline, reason) {
  return post(`/experiments/${uuid}/extend`, {
    phase,
    new_deadline: newDeadline,
    reason,
  });
}

export async function cancelExperiment(uuid, reason) {
  return post(`/experiments/${uuid}/cancel`, { reason });
}

export async function scheduleTesting(uuid, startDate, durationDays = 4) {
  return post(`/experiments/${uuid}/schedule-testing`, {
    start_date: startDate,
    duration_days: durationDays,
  });
}

export async function editTestingSchedule(uuid, startDate, durationDays = null) {
  const payload = { start_date: startDate };
  if (durationDays !== null) {
    payload.duration_days = durationDays;
  }
  return post(`/experiments/${uuid}/edit-testing-schedule`, payload);
}

export async function reopenExperiment() {
  throw new Error('Reopening cancelled experiments is not available.');
}

// Observations
export async function submitObservation(uuid, dayNumber, content) {
  return post(`/experiments/${uuid}/observations`, { day_number: dayNumber, content });
}

export async function listObservations(uuid) {
  return get(`/experiments/${uuid}/observations`);
}

export async function getObservationSchedule(uuid) {
  return get(`/experiments/${uuid}/observations/schedule`);
}

export async function getIterationObservations(uuid) {
  return listObservations(uuid);
}

export async function getIterationObservationSchedule(uuid) {
  return getObservationSchedule(uuid);
}

export async function editObservation(uuid, dayNumber, content) {
  return submitObservation(uuid, dayNumber, content);
}

// Activities
export async function getExperimentActivities(uuid) {
  return get(`/experiments/${uuid}/activities`);
}

export async function getRecentActivities(limit = 50) {
  return get(`/activities/recent?limit=${limit}`);
}

// Raw Ideas
export async function createRawIdea(title, description) {
  return post('/experiments/raw-ideas', { title, description });
}

export async function listRawIdeas() {
  return get('/experiments/raw-ideas');
}

export async function takeRawIdea(uuid, data) {
  return post(`/experiments/${uuid}/take`, data);
}
