// Hirevoxa Client API Configuration & Preview Isolation Guard
// Enforces fail-closed configuration to ensure Preview builds never accidentally call the Production API.

/**
 * Checks if a hostname matches a Vercel Preview deployment domain.
 * Vercel Preview domains end in '.vercel.app' but exclude the canonical production domain 'hirevoxa.vercel.app'.
 */
export function isVercelPreviewHostname(hostname) {
  if (!hostname || typeof hostname !== 'string') return false;
  const host = hostname.trim().toLowerCase();
  if (host === 'hirevoxa.vercel.app') return false;
  return host.endsWith('.vercel.app');
}

/**
 * Determines whether the frontend is executing within a Preview environment.
 * Evaluates both build-time Vercel environment flags and runtime browser hostnames.
 */
export function isFrontendPreview(env = {}, hostname = '') {
  if (env?.VITE_VERCEL_ENV === 'preview') return true;
  if (isVercelPreviewHostname(hostname)) return true;
  return false;
}

/**
 * Validates a Preview API Base URL.
 * Enforces HTTPS protocol and strictly prevents pointing Preview to the Production backend.
 */
export function validatePreviewApiUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    throw new Error('[Hirevoxa Config Error] Preview deployment missing required VITE_API_BASE_URL. In Preview environments, an explicit HTTPS backend URL is required to prevent accidental calls to the Production API. Configure VITE_API_BASE_URL in your Vercel Preview environment variables.');
  }

  const trimmed = url.trim();

  if (!/^https:\/\//i.test(trimmed)) {
    throw new Error(`[Hirevoxa Config Error] Invalid VITE_API_BASE_URL '${trimmed}' in Preview environment. Preview API URL must use secure HTTPS protocol.`);
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    if (host === 'hirevoxa-server.vercel.app') {
      throw new Error('[Hirevoxa Config Error] Preview VITE_API_BASE_URL cannot point to the Production backend (https://hirevoxa-server.vercel.app). Preview environments must point to an isolated Preview backend to protect production data.');
    }
  } catch (err) {
    if (err.message.includes('Preview VITE_API_BASE_URL cannot point to the Production backend')) {
      throw err;
    }
    throw new Error(`[Hirevoxa Config Error] Invalid VITE_API_BASE_URL '${trimmed}': ${err.message}`);
  }

  return trimmed.replace(/\/+$/, '');
}

/**
 * Resolves the API Base URL with strict fail-closed isolation.
 *
 * Rules:
 * 1. Preview environments MUST have an explicit HTTPS VITE_API_BASE_URL pointing to an isolated Preview backend.
 *    Missing or invalid values throw immediately (fail-closed). Falling back to Production or localhost is prohibited.
 * 2. Explicit VITE_API_BASE_URL override takes precedence in non-preview environments.
 * 3. Canonical production hostnames ('hirevoxa.vercel.app', 'hirevoxa.com') fall back to the Production backend.
 * 4. Local development (localhost, 127.0.0.1) falls back to 'http://localhost:5000/api'.
 */
export function resolveApiBaseUrl(env = {}, hostname = '') {
  const isPreview = isFrontendPreview(env, hostname);

  if (isPreview) {
    // Fail-closed in Preview: require explicit, valid, HTTPS, non-production URL
    return validatePreviewApiUrl(env?.VITE_API_BASE_URL);
  }

  // Explicit override takes priority in all environments
  if (env?.VITE_API_BASE_URL && typeof env.VITE_API_BASE_URL === 'string' && env.VITE_API_BASE_URL.trim() !== '') {
    return env.VITE_API_BASE_URL.trim().replace(/\/+$/, '');
  }

  // Canonical production domains
  const host = (hostname || '').trim().toLowerCase();
  if (host === 'hirevoxa.vercel.app' || host === 'hirevoxa.com' || host.endsWith('.hirevoxa.com')) {
    return 'https://hirevoxa-server.vercel.app/api';
  }

  // Local development default (localhost / 127.0.0.1)
  return 'http://localhost:5000/api';
}
