import { get, post, put, del, patch } from './client';

export async function createExperiment(data) {
  return post('/experiments', data);
}

export async function listExperiments(view = 'all') {
  return get(`/experiments?view=${view}`);
}

export async function getExperiment(uuid) {
  return get(`/experiments/${uuid}`);
}

export async function updateExperiment(uuid, data) {
  return put(`/experiments/${uuid}`, data);
}

export async function deleteExperiment(uuid) {
  return del(`/experiments/${uuid}`);
}

export async function cancelExperiment(uuid) {
  return post(`/experiments/${uuid}/cancel`, {});
}

export async function updatePhase(uuid, phase) {
  return patch(`/experiments/${uuid}/phase`, { phase });
}

export async function extendDeadline(uuid, phase, newDeadline, reason) {
  return post(`/experiments/${uuid}/extend`, {
    phase,
    new_deadline: newDeadline,
    reason,
  });
}

export async function submitDecision(uuid, decision, reason) {
  return post(`/experiments/${uuid}/decision`, { decision, reason });
}

export async function overrideDecision(uuid, decision, reason) {
  return post(`/experiments/${uuid}/decision/override`, { decision, reason });
}

export async function addObservation(uuid, content, metrics = {}) {
  return post(`/experiments/${uuid}/observations`, { content, metrics });
}

export async function listObservations(uuid) {
  return get(`/experiments/${uuid}/observations`);
}
