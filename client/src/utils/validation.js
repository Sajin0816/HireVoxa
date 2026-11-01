/**
 * Global Form Validation Utilities for Hirevoxa
 * Provides consistent validation rules, email checks, and styling helpers.
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Checks whether a value is a valid email format.
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Checks whether a value is non-empty (handles strings, arrays, numbers).
 */
export function isRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return !isNaN(value);
  return Boolean(value);
}

/**
 * Returns consistent Tailwind border and focus classes based on error state.
 *
 * @param {boolean|string} hasError - Truthy if field has a validation error
 * @param {string} defaultBorder - Custom base border styling if needed
 * @param {string} errorBorder - Custom error border styling if needed
 */
export function getInputErrorClass(
  hasError,
  defaultBorder = 'border-[#303030] focus:border-[#505050]',
  errorBorder = 'border-[#EF4444]/60 focus:border-[#EF4444]'
) {
  return hasError ? errorBorder : defaultBorder;
}

/**
 * Automatically focuses the first invalid form field to preserve accessibility.
 *
 * @param {Object} errors - Map of field errors
 * @param {Object} refs - Map of React refs matching field names
 */
export function focusFirstError(errors, refs = {}) {
  if (!errors || typeof errors !== 'object') return;
  const fields = Object.keys(errors);
  for (const field of fields) {
    if (refs[field]?.current?.focus) {
      refs[field].current.focus();
      return;
    }
    const el = document.getElementById(field);
    if (el && typeof el.focus === 'function') {
      el.focus();
      return;
    }
  }
}

