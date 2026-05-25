import { post, get } from './client';

export async function login(email, password) {
  return post('/auth/login', { email, password });
}

export async function logout() {
  return post('/auth/logout', {});
}

export async function getMe() {
  return get('/auth/me');
}

export async function checkAuth() {
  try {
    const data = await getMe();
    return data.user;
  } catch (error) {
    return null;
  }
}
