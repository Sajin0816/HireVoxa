/**
 * Hirevoxa Application Security Utilities
 * Defensive helpers for input sanitization, regex escaping, and security validation.
 */

/**
 * Escapes all regular expression metacharacters in a user-supplied string
 * to prevent ReDoS (Regular Expression Denial of Service) and RegExp syntax errors.
 *
 * @param {string} text - The input string to escape
 * @returns {string} - The escaped string safe for new RegExp()
 */
export function escapeRegex(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
}

/**
 * Constructs a safe, bounded regular expression from user input.
 * Returns null if the resulting escaped string is empty.
 *
 * @param {string} text - User input string
 * @param {string} [flags='i'] - RegExp flags
 * @returns {RegExp|null}
 */
export function safeRegex(text, flags = 'i') {
  const escaped = escapeRegex(text);
  if (!escaped) return null;
  return new RegExp(escaped, flags);
}

/**
 * Validates an email address against RFC-compliant standard format.
 *
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  // Standard RFC 5322 regex approximation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}
