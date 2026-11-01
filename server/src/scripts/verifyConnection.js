import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB, disconnectDB, getDbMode } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function verifyLiveConnection() {
  console.log('[Hirevoxa DB Check] Verifying live database connectivity...');
  try {
    const conn = await connectDB();
    const mode = getDbMode();
    console.log(`[Hirevoxa DB Check] Operating mode: ${mode}`);

    if (mode !== 'mongodb') {
      console.warn(`[Hirevoxa DB Check] Notice: Database is running in '${mode}' mode.`);
      process.exit(0);
    }

    const adminDb = mongoose.connection.db.admin();
    const ping = await adminDb.ping();
    console.log('[Hirevoxa DB Check] Ping successful:', ping);

    const dbName = mongoose.connection.name || mongoose.connection.db.databaseName;
    console.log(`[Hirevoxa DB Check] Active database: ${dbName}`);

    await disconnectDB();
    console.log('[Hirevoxa DB Check] Clean disconnect completed.');
    process.exit(0);
  } catch (err) {
    console.error(`[Hirevoxa DB Check Error] ${err.message}`);
    process.exit(1);
  }
}

verifyLiveConnection();
