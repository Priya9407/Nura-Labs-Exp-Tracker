import { post, get } from './client';

export async function inviteUser(email, name, role = 'MEMBER') {
  return post('/users/invite', { email, name, role });
}

export async function activateAccount(token, password) {
  return post('/users/activate', { token, password });
}

export async function listUsers() {
  return get('/users');
}
