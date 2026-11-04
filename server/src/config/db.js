import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Only load local .env files in non-production environments to preserve authoritative platform injection in Vercel
if (process.env.NODE_ENV !== 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  dotenv.config();
}

let activeDbMode = 'unavailable';
let connectionPromise = null;

// Disable Mongoose query buffering so disconnected operations fail fast instead of hanging serverless requests
mongoose.set('bufferCommands', false);

/**
 * Determines whether the current process is running inside a Preview deployment.
 * Detects Vercel platform environment (VERCEL_ENV === 'preview') or explicit APP_ENV === 'preview'.
 */
export function isPreviewDeployment() {
  return process.env.VERCEL_ENV === 'preview' || process.env.APP_ENV === 'preview';
}

/**
 * Resolves the target database name with strict fail-closed isolation rules.
 *
 * Rules:
 * 1. In Preview environments (VERCEL_ENV === 'preview'):
 *    - An explicit MONGODB_DB_NAME is strictly REQUIRED.
 *    - Falling back to 'hirevoxa' is strictly prohibited.
 *    - Explicitly setting MONGODB_DB_NAME='hirevoxa' is rejected with an isolation error.
 *    - MONGODB_DB_NAME must strictly equal 'hirevoxa_qa'.
 * 2. In Production (VERCEL_ENV === 'production' or NODE_ENV === 'production'):
 *    - Uses configured MONGODB_DB_NAME or canonical default 'hirevoxa'.
 * 3. In Local/Development:
 *    - Uses configured MONGODB_DB_NAME or default 'hirevoxa'.
 */
export function resolveDbName() {
  const isPreview = isPreviewDeployment();
  const rawDbName = typeof process.env.MONGODB_DB_NAME === 'string' ? process.env.MONGODB_DB_NAME.trim() : '';

  if (isPreview) {
    if (!rawDbName) {
      throw new Error('[Hirevoxa DB Isolation Error] Missing MONGODB_DB_NAME in Preview environment. Preview deployments require an explicitly configured database name (must be \'hirevoxa_qa\'). Silently falling back to the production database is strictly prohibited.');
    }
    if (rawDbName === 'hirevoxa') {
      throw new Error('[Hirevoxa DB Isolation Error] Resolved database in Preview environment is \'hirevoxa\'. Connecting a Preview deployment to the production database is strictly prohibited. Configure MONGODB_DB_NAME=hirevoxa_qa in your Vercel Preview environment variables.');
    }
    if (rawDbName !== 'hirevoxa_qa') {
      throw new Error(`[Hirevoxa DB Isolation Error] Invalid MONGODB_DB_NAME '${rawDbName}' in Preview environment. Preview deployments are strictly restricted to 'hirevoxa_qa'.`);
    }
    return 'hirevoxa_qa';
  }

  return rawDbName || 'hirevoxa';
}

/**
 * Resolves the MongoDB connection URI from environment variables without exposing credentials or hardcoded fallbacks.
 */
export function getMongoUri() {
  if (typeof process.env.MONGODB_URI === 'string' && process.env.MONGODB_URI.trim() !== '') {
    return process.env.MONGODB_URI.trim();
  }
  return '';
}

/**
 * Sanitizes connection strings and error messages to prevent leaking credentials in logs.
 * Replaces credentials like 'mongodb+srv://user:pass@host' with 'mongodb+srv://user:***@host'.
 */
export function sanitizeError(error) {
  if (!error) return 'Unknown error';
  const message = typeof error === 'string' ? error : (error.message || String(error));
  return message.replace(/:\/\/([^:]+):([^@]+)@/g, '://$1:***@');
}

/**
 * Evaluates whether demonstration/in-memory mode is allowed.
 * Strictly prohibited in production, preview, or when REQUIRE_DB is set.
 */
export function isDemoModeAllowed() {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'preview' || process.env.REQUIRE_DB === 'true') {
    return false;
  }
  return process.env.NODE_ENV === 'test' || process.env.ALLOW_IN_MEMORY_DEMO === 'true';
}

/**
 * Connects to MongoDB or initializes explicit in-memory demo mode if permitted.
 * Handles concurrent cold-start requests with a shared connection promise to eliminate race conditions.
 * Fails fast with safe sanitized errors if required MongoDB is missing or unreachable.
 */
export async function connectDB(overrideUri = null) {
  // If already connected, ensure operating mode is synchronized and return
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    activeDbMode = 'mongodb';
    return mongoose.connection;
  }

  // If a connection attempt is currently in-flight, await the existing promise
  if (connectionPromise) {
    return connectionPromise;
  }

  const isPreview = isPreviewDeployment();

  // Preserve isolated test fixture behavior when running automated test runner unless explicitly testing against live DB or preview isolation
  if (process.env.NODE_ENV === 'test' && !overrideUri && process.env.TEST_WITH_LIVE_DB !== 'true' && !isPreview) {
    activeDbMode = 'in-memory-demo';
    return;
  }

  // In non-production demo mode where in-memory was already explicitly initialized
  if (activeDbMode === 'in-memory-demo' && !overrideUri && !process.env.MONGODB_URI && !isPreview) {
    return;
  }

  // Enforce fail-closed database name resolution upfront
  const targetDbName = resolveDbName();

  const uri = overrideUri !== null ? overrideUri : getMongoUri();

  if (!uri || uri.trim() === '') {
    activeDbMode = 'unavailable';
    if (isPreview) {
      throw new Error('[Hirevoxa DB Config Error] Missing MONGODB_URI. Preview environments require an explicitly configured MONGODB_URI environment variable.');
    }
    if (!isDemoModeAllowed()) {
      throw new Error('[Hirevoxa DB Config Error] Missing MONGODB_URI. Production environments require an explicitly configured MONGODB_URI environment variable.');
    }
    activeDbMode = 'in-memory-demo';
    console.log('[Hirevoxa DB] Operating in explicit In-Memory Demonstration Mode (development/test only).');
    return;
  }

  connectionPromise = (async () => {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        const conn = await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 15000,
          connectTimeoutMS: 15000,
          socketTimeoutMS: 30000,
          maxPoolSize: 10,
          minPoolSize: 0,
          retryWrites: true,
          w: 'majority',
          dbName: targetDbName
        });

        // Fail-closed verification after connection: ensure Preview never connects to production
        if (isPreview && conn.connection.name !== 'hirevoxa_qa') {
          await mongoose.disconnect();
          activeDbMode = 'unavailable';
          throw new Error(`[Hirevoxa DB Isolation Error] Connected database name '${conn.connection.name}' does not match required QA database 'hirevoxa_qa'. Connection terminated.`);
        }

        activeDbMode = 'mongodb';
        console.log(`[Hirevoxa DB] Connected to MongoDB cluster host: ${conn.connection.host} (Database: ${conn.connection.name})`);
        return conn;
      } catch (error) {
        if (attempts < maxAttempts) {
          console.warn(`[Hirevoxa DB] Connection attempt ${attempts} encountered transient issue (${sanitizeError(error)}). Retrying in 1.5s...`);
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }

        const safeMsg = sanitizeError(error);
        if (!isDemoModeAllowed() || isPreview) {
          activeDbMode = 'unavailable';
          throw new Error(`[Hirevoxa DB Connection Error] Unable to connect to MongoDB: ${safeMsg}`);
        }
        activeDbMode = 'in-memory-demo';
        console.warn(`[Hirevoxa DB] Could not connect to MongoDB (${safeMsg}). Explicit demo mode is allowed in current non-production environment; using in-memory store.`);
        return;
      }
    }
  })();

  try {
    const result = await connectionPromise;
    return result;
  } finally {
    connectionPromise = null;
  }
}

/**
 * Cleanly disconnects from MongoDB and resets database state.
 */
export async function disconnectDB() {
  connectionPromise = null;
  if (mongoose.connection && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Hirevoxa DB] Disconnected cleanly from MongoDB.');
  }
  activeDbMode = 'unavailable';
}

/**
 * Returns current database operating mode ('mongodb', 'in-memory-demo', 'connecting', or 'unavailable').
 */
export function getDbMode() {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return 'mongodb';
  }
  if (mongoose.connection && mongoose.connection.readyState === 2) {
    return 'connecting';
  }
  return activeDbMode;
}

/**
 * Returns granular database connection state:
 * 'connected', 'connecting', 'configuration_missing', 'connection_failed', or 'disconnected'.
 */
export function getDbState() {
  const hasUri = Boolean(getMongoUri());
  if (!hasUri && (!isDemoModeAllowed() || isPreviewDeployment())) {
    return 'configuration_missing';
  }
  if (!mongoose.connection) {
    return activeDbMode === 'in-memory-demo' ? 'connected' : 'disconnected';
  }
  switch (mongoose.connection.readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      if (activeDbMode === 'in-memory-demo') return 'connected';
      if (activeDbMode === 'unavailable') return 'connection_failed';
      return 'disconnected';
  }
}

/**
 * Returns the currently connected database name.
 */
export function getDbName() {
  return (mongoose.connection && mongoose.connection.name) || 'none';
}
