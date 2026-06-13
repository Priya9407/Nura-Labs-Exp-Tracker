const API_BASE_URL = '/api';
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Track in-flight requests for deduplication
const inFlightRequests = new Map();

// CSRF Token storage
let csrfToken = null;

class APIError extends Error {
  constructor(message, code, status, data = null) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.status = status;
    this.data = data;
  }
}

/**
 * Get CSRF token from cookie or storage
 */
function getCSRFToken() {
  // First check if we have a token in memory
  if (csrfToken) {
    return csrfToken;
  }

  // Try to get from cookie
  const cookieMatch = document.cookie.match(/csrf_token=([^;]+)/);
  if (cookieMatch) {
    csrfToken = cookieMatch[1];
    return csrfToken;
  }

  return null;
}

/**
 * Set CSRF token
 */
export function setCSRFToken(token) {
  csrfToken = token;
}

/**
 * Fetch CSRF token from server
 */
export async function fetchCSRFToken() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/csrf`, {
      credentials: 'include',
    });
    const data = await response.json();
    if (data.success && data.csrf_token) {
      setCSRFToken(data.csrf_token);
      return data.csrf_token;
    }
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
  return null;
}

// Create an AbortController with timeout
function createTimeoutController(timeoutMs = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  return { controller, timeoutId };
}

async function handleResponse(response) {
  // Check if response is ok before trying to parse JSON
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorData = null;
    let errorCode = null;

    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error?.message || errorMessage;
      errorCode = errorBody.error?.code || null;
      errorData = errorBody;
    } catch (parseError) {
      // Response body is not JSON, use default error message
    }

    throw new APIError(errorMessage, errorCode, response.status, errorData);
  }

  // Try to parse successful response as JSON
  try {
    const data = await response.json();

    // Check for API-level errors (successful HTTP but error in response body)
    if (!data.success) {
      const error = new APIError(
        data.error?.message || 'An error occurred',
        data.error?.code,
        response.status,
        data
      );
      throw error;
    }

    return data;
  } catch (parseError) {
    // If JSON parsing fails for a successful response, return a success response
    if (parseError instanceof APIError) {
      throw parseError;
    }
    return { success: true, data: null };
  }
}

// Deduplication key generator
function getDeduplicationKey(endpoint, method, body) {
  return `${method}:${endpoint}:${body ? JSON.stringify(body) : ''}`;
}

export async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const { timeout = REQUEST_TIMEOUT, deduplicate = true, dedupKey, skipCSRF = false, ...fetchOptions } = options;

  // Deduplication check
  const dedupId = dedupKey || getDeduplicationKey(endpoint, fetchOptions.method || 'GET', fetchOptions.body);

  if (deduplicate && inFlightRequests.has(dedupId)) {
    // Return the existing promise for this request
    return inFlightRequests.get(dedupId);
  }

  // Get CSRF token for non-GET requests
  const token = !skipCSRF && fetchOptions.method && fetchOptions.method !== 'GET'
    ? getCSRFToken() || await fetchCSRFToken()
    : null;

  const config = {
    ...fetchOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'X-CSRF-Token': token }),
      ...fetchOptions.headers,
    },
  };

  // Create timeout controller
  const { controller, timeoutId } = createTimeoutController(timeout);
  config.signal = controller.signal;

  // Create the fetch promise
  const fetchPromise = (async () => {
    try {
      const response = await fetch(url, config);
      const result = await handleResponse(response);
      return result;
    } catch (error) {
      // Handle specific error types
      if (error.name === 'AbortError') {
        throw new APIError('Request timed out. Please try again.', 'TIMEOUT', 408);
      }

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new APIError('Network error. Please check your connection.', 'NETWORK_ERROR', 0);
      }

      // Re-throw APIErrors
      if (error instanceof APIError) {
        throw error;
      }

      // Generic error
      throw new APIError(error.message || 'An unexpected error occurred', 'UNKNOWN_ERROR', 500);
    } finally {
      clearTimeout(timeoutId);
      // Remove from in-flight requests
      if (deduplicate) {
        inFlightRequests.delete(dedupId);
      }
    }
  })();

  // Store the promise for deduplication
  if (deduplicate) {
    inFlightRequests.set(dedupId, fetchPromise);
  }

  return fetchPromise;
}

export async function post(endpoint, body, options = {}) {
  return fetchAPI(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options,
  });
}

export async function get(endpoint, options = {}) {
  return fetchAPI(endpoint, {
    method: 'GET',
    ...options,
  });
}

export async function put(endpoint, body, options = {}) {
  return fetchAPI(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
    ...options,
  });
}

export async function patch(endpoint, body, options = {}) {
  return fetchAPI(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
    ...options,
  });
}

export async function del(endpoint, options = {}) {
  return fetchAPI(endpoint, {
    method: 'DELETE',
    ...options,
  });
}

// Utility to check if an error is a specific type
export function isAPIError(error) {
  return error instanceof APIError;
}

export function isNetworkError(error) {
  return error instanceof APIError && error.code === 'NETWORK_ERROR';
}

export function isTimeoutError(error) {
  return error instanceof APIError && error.code === 'TIMEOUT';
}

export function isAuthError(error) {
  return error instanceof APIError && error.status === 401;
}

// Re-export APIError for use in other modules
export { APIError };
