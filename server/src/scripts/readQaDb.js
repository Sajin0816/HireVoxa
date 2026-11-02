import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'hirevoxa_qa';

export async function getDbClient() {
  if (mongoose.connection.readyState === 1) return mongoose.connection.db;
  await mongoose.connect(uri, { dbName });
  return mongoose.connection.db;
}

export async function inspectCollection(collectionName, query = {}) {
  const db = await getDbClient();
  const docs = await db.collection(collectionName).find(query).sort({ _id: -1 }).limit(5).toArray();
  return docs.map(doc => {
    const sanitized = { ...doc };
    if (sanitized.password) sanitized.password = '[HASHED_AND_PROTECTED]';
    return sanitized;
  });
}

if (process.argv[2]) {
  const col = process.argv[2];
  const query = process.argv[3] ? JSON.parse(process.argv[3]) : {};
  inspectCollection(col, query).then(res => {
    console.log(JSON.stringify({ database: dbName, collection: col, count: res.length, records: res }, null, 2));
    process.exit(0);
  }).catch(err => {
    console.error('DB QUERY ERROR:', err.message);
    process.exit(1);
  });
}
