/**
 * Hirevoxa Navigation & Routing Utilities
 *
 * Centralizes role-based dashboard destination resolution and navigation helpers.
 */

/**
 * Returns the authoritative dashboard destination for a user based on their role.
 *
 * Roles:
 * - 'candidate' -> '/candidate' (Candidate workspace)
 * - 'admin'     -> '/admin' (Operations admin panel)
 * - 'company'   -> '/app' (Recruitment / Employer dashboard)
 * - 'employer'  -> '/app' (Alias for company workspace)
 * - fallback    -> '/app' (or '/login' if user is missing)
 *
 * @param {object|null|undefined} user Authenticated user object
 * @returns {string} Target dashboard pathname
 */
export function getDashboardPath(user) {
  if (!user) return '/login';
  const role = typeof user.role === 'string' ? user.role.trim().toLowerCase() : '';
  if (role === 'candidate') return '/candidate';
  if (role === 'admin') return '/admin';
  if (role === 'company' || role === 'employer') return '/app';
  return '/app';
}

/**
 * Returns user-friendly dashboard label corresponding to role.
 *
 * @param {object|null|undefined} user Authenticated user object
 * @returns {string} Dashboard button label
 */
export function getDashboardLabel(user) {
  if (!user) return 'Dashboard';
  const role = typeof user.role === 'string' ? user.role.trim().toLowerCase() : '';
  if (role === 'candidate') return 'Candidate Dashboard';
  if (role === 'admin') return 'Admin Panel';
  return 'Dashboard';
}

