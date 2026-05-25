const API_BASE_URL = '/api';

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

export async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  return handleResponse(response);
}

export async function post(endpoint, body) {
  return fetchAPI(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function get(endpoint) {
  return fetchAPI(endpoint, {
    method: 'GET',
  });
}

export async function put(endpoint, body) {
  return fetchAPI(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function patch(endpoint, body) {
  return fetchAPI(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function del(endpoint) {
  return fetchAPI(endpoint, {
    method: 'DELETE',
  });
}
