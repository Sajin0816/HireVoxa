import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

let activeDbMode = 'unavailable';

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
 * Strictly prohibited in production or when REQUIRE_DB is set.
 */
export function isDemoModeAllowed() {
  if (process.env.NODE_ENV === 'production' || process.env.REQUIRE_DB === 'true') {
    return false;
  }
  return process.env.NODE_ENV === 'test' || process.env.ALLOW_IN_MEMORY_DEMO === 'true';
}

/**
 * Connects to MongoDB or initializes explicit in-memory demo mode if permitted.
 * Fails fast with safe sanitized errors if required MongoDB is missing or unreachable.
 */
export async function connectDB(overrideUri = null) {
  // Prevent duplicate connections if already connected or connecting
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return mongoose.connection;
  }

  // Preserve isolated test fixture behavior when running automated test runner unless explicitly testing against live DB
  if (process.env.NODE_ENV === 'test' && !overrideUri && process.env.TEST_WITH_LIVE_DB !== 'true') {
    activeDbMode = 'in-memory-demo';
    return;
  }

  const uri = overrideUri || process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    if (!isDemoModeAllowed()) {
      activeDbMode = 'unavailable';
      throw new Error('[Hirevoxa DB Config Error] Missing MONGODB_URI. Normal startup requires a configured MongoDB connection string. Demo mode is disabled.');
    }
    activeDbMode = 'in-memory-demo';
    console.log('[Hirevoxa DB] Operating in explicit In-Memory Demonstration Mode (development/test only).');
    return;
  }

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        dbName: 'hirevoxa'
      });
      activeDbMode = 'mongodb';
      console.log(`[Hirevoxa DB] Connected to MongoDB cluster host: ${conn.connection.host} (Database: ${conn.connection.name})`);
      return conn;
    } catch (error) {
      if (attempts < maxAttempts) {
        console.warn(`[Hirevoxa DB] Initial connection attempt ${attempts} encountered transient issue (${sanitizeError(error)}). Retrying in 2s...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }

      const safeMsg = sanitizeError(error);
      if (!isDemoModeAllowed()) {
        activeDbMode = 'unavailable';
        throw new Error(`[Hirevoxa DB Connection Error] Unable to connect to MongoDB: ${safeMsg}`);
      }
      activeDbMode = 'in-memory-demo';
      console.warn(`[Hirevoxa DB] Could not connect to MongoDB (${safeMsg}). Explicit demo mode is allowed in current non-production environment; using in-memory store.`);
      return;
    }
  }
}

/**
 * Cleanly disconnects from MongoDB and resets database state.
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Hirevoxa DB] Disconnected cleanly from MongoDB.');
  }
  activeDbMode = 'unavailable';
}

/**
 * Returns current database operating mode ('mongodb', 'in-memory-demo', or 'unavailable').
 */
export function getDbMode() {
  return activeDbMode;
}
