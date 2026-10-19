import 'dotenv/config';
import mongoose from 'mongoose';
import { Candidate } from '../models/Candidate.js';
import { Job } from '../models/Job.js';
import { Interview } from '../models/Interview.js';
import { seedCandidates, seedJobs, seedInterviews } from './seedData.js';

async function seedDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('[Seed] No MONGODB_URI provided. In-Memory store is automatically seeded upon server startup.');
    process.exit(0);
  }

  try {
    await mongoose.connect(uri);
    console.log('[Seed] Connected to MongoDB for seeding.');

    // Only seed if collections are empty or explicitly requested, never wiping non-demo data
    const existingCount = await Candidate.countDocuments({ isDemoRecord: true });

    if (existingCount > 0) {
      console.log(`[Seed] Demo records already exist (${existingCount} found). Skipping deletion to preserve integrity.`);
    } else {
      await Candidate.insertMany(seedCandidates);
      await Job.insertMany(seedJobs);
      await Interview.insertMany(seedInterviews);
      console.log(`[Seed] Successfully seeded ${seedCandidates.length} candidates, ${seedJobs.length} jobs, and ${seedInterviews.length} interviews.`);
    }

    await mongoose.disconnect();
    console.log('[Seed] Seeding process complete.');
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Seeding failed:', err.message);
    process.exit(1);
  }
}

seedDatabase();
