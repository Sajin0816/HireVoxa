import mongoose from 'mongoose';

let activeDbMode = 'in-memory-demo';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    activeDbMode = 'in-memory-demo';
    console.log('[Hirevoxa DB] No MONGODB_URI provided. Running in explicit In-Memory Demonstration Mode.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    activeDbMode = 'mongodb';
    console.log(`[Hirevoxa DB] Connected to MongoDB: ${conn.connection.host}`);
  } catch (error) {
    activeDbMode = 'in-memory-demo';
    console.warn(`[Hirevoxa DB] Could not connect to MongoDB (${error.message}). Falling back to In-Memory Demonstration Mode.`);
  }
}

export function getDbMode() {
  return activeDbMode;
}
