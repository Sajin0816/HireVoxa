import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function check() {
  const conn = await mongoose.connect(process.env.MONGODB_URI, { dbName: 'hirevoxa_qa' });
  const db = conn.connection.db;

  const interviews = await db.collection('interviews').find({}).toArray();
  console.log(`Found ${interviews.length} interviews:`, interviews);
  await mongoose.disconnect();
}

check().catch(console.error);
