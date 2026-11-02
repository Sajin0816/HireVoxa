/**
 * Hirevoxa Authoritative JWT Configuration & Security Module
 *
 * Centralizes JWT secret resolution, validation, and safe diagnostics.
 * - In production: strictly requires an explicitly configured JWT_SECRET.
 *   Throws a descriptive error if missing or invalid.
 *   Never falls back to a hardcoded or predictable string in production.
 * - In development/test: falls back safely to a dedicated dev secret
 *   to ensure zero friction in local development and test environments.
 * - Never logs or exposes secret values.
 */

const DEV_JWT_SECRET = 'hirevoxa_jwt_secret_dev_2026';

/**
 * Checks whether an explicit, valid JWT_SECRET is configured.
 * Returns true only when JWT_SECRET is a non-empty string different from the dev placeholder.
 */
export function isJwtConfigured() {
  const secret = process.env.JWT_SECRET;
  return Boolean(
    secret &&
    typeof secret === 'string' &&
    secret.trim() !== '' &&
    secret.trim() !== DEV_JWT_SECRET
  );
}

/**
 * Returns the authoritative JWT secret.
 * In production: strictly requires an explicitly configured JWT_SECRET.
 * In dev/test: returns the configured secret or dev fallback.
 */
export function getJwtSecret() {
  if (isJwtConfigured()) {
    return process.env.JWT_SECRET.trim();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[Hirevoxa Security Error] Missing JWT_SECRET. Production environments require an explicitly configured JWT_SECRET environment variable.'
    );
  }

  return DEV_JWT_SECRET;
}

/**
 * Returns safe JWT diagnostics for the health endpoint.
 * Reports configuration status and string length without exposing secret contents.
 */
export function getJwtDiagnostics() {
  const configured = isJwtConfigured();
  return {
    jwtConfigured: configured,
    jwtLength: configured ? process.env.JWT_SECRET.trim().length : 0
  };
}

