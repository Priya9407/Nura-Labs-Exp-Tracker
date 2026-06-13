import { post, get, patch } from './client';

export async function inviteUser(email, name, role = 'MEMBER') {
  return post('/users/invite', { email, name, role });
}

export async function activateAccount(token, password) {
  return post('/users/activate', { token, password });
}

export async function listUsers() {
  return get('/users');
}

export async function updateProfile(updates) {
  return patch('/users/me', updates);
}

export async function changePassword(currentPassword, newPassword) {
  return post('/auth/change-password', { current_password: currentPassword, new_password: newPassword });
}

export async function forgotPassword(email) {
  return post('/auth/forgot-password', { email });
}

export async function deactivateUser(uuid, reason = '') {
  return post(`/users/${uuid}/deactivate`, { reason });
}

export async function activateUser(uuid) {
  return post(`/users/${uuid}/activate`, {});
}
