/**
 * Validation utility for form inputs
 */

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Password minimum requirements
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

// Name validation
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export function validateEmail(email) {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (trimmedEmail.length > 254) {
    return { isValid: false, error: 'Email is too long' };
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate password
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export function validatePassword(password, options = {}) {
  const { allowEmpty = false, minLength = MIN_PASSWORD_LENGTH } = options;

  if (!password || password === '') {
    if (allowEmpty) {
      return { isValid: true, error: null };
    }
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < minLength) {
    return { isValid: false, error: `Password must be at least ${minLength} characters` };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return { isValid: false, error: `Password must be less than ${MAX_PASSWORD_LENGTH} characters` };
  }

  return { isValid: true, error: null };
}

/**
 * Validate name
 * @param {string} name - Name to validate
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export function validateName(name) {
  if (!name || name.trim() === '') {
    return { isValid: false, error: 'Name is required' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < MIN_NAME_LENGTH) {
    return { isValid: false, error: `Name must be at least ${MIN_NAME_LENGTH} characters` };
  }

  if (trimmedName.length > MAX_NAME_LENGTH) {
    return { isValid: false, error: `Name must be less than ${MAX_NAME_LENGTH} characters` };
  }

  // Check for invalid characters (only letters, spaces, hyphens, and apostrophes)
  const validNameRegex = /^[a-zA-Z\s'-]+$/;
  if (!validNameRegex.test(trimmedName)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate UUID
 * @param {string} uuid - UUID to validate
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export function validateUUID(uuid) {
  if (!uuid || uuid.trim() === '') {
    return { isValid: false, error: 'UUID is required' };
  }

  if (!UUID_REGEX.test(uuid)) {
    return { isValid: false, error: 'Invalid UUID format' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate experiment name
 * @param {string} name - Experiment name to validate
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export function validateExperimentName(name) {
  if (!name || name.trim() === '') {
    return { isValid: false, error: 'Experiment name is required' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 3) {
    return { isValid: false, error: 'Experiment name must be at least 3 characters' };
  }

  if (trimmedName.length > 200) {
    return { isValid: false, error: 'Experiment name must be less than 200 characters' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate experiment hypothesis
 * @param {string} hypothesis - Hypothesis to validate
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export function validateHypothesis(hypothesis) {
  if (!hypothesis || hypothesis.trim() === '') {
    return { isValid: false, error: 'Hypothesis is required' };
  }

  const trimmedHypothesis = hypothesis.trim();

  if (trimmedHypothesis.length < 10) {
    return { isValid: false, error: 'Hypothesis must be at least 10 characters' };
  }

  if (trimmedHypothesis.length > 2000) {
    return { isValid: false, error: 'Hypothesis must be less than 2000 characters' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate observation text
 * @param {string} text - Observation text to validate
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export function validateObservation(text) {
  if (!text || text.trim() === '') {
    return { isValid: false, error: 'Observation text is required' };
  }

  const trimmedText = text.trim();

  if (trimmedText.length < 5) {
    return { isValid: false, error: 'Observation must be at least 5 characters' };
  }

  if (trimmedText.length > 5000) {
    return { isValid: false, error: 'Observation must be less than 5000 characters' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate form data
 * @param {Object} data - Form data object
 * @param {Object} validators - Map of field names to validator functions
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export function validateForm(data, validators) {
  const errors = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(validators)) {
    const value = data[field];
    const result = validator(value);

    if (!result.isValid) {
      errors[field] = result.error;
      isValid = false;
    }
  }

  return { isValid, errors };
}

/**
 * Sanitize input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
}

/**
 * Sanitize HTML content (if needed)
 * @param {string} html - HTML content to sanitize
 * @returns {string} - Sanitized HTML
 */
export function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Simple HTML entity encoding
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default {
  validateEmail,
  validatePassword,
  validateName,
  validateUUID,
  validateExperimentName,
  validateHypothesis,
  validateObservation,
  validateForm,
  sanitizeInput,
  sanitizeHTML,
};
