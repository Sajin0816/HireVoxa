#!/usr/bin/env node
/**
 * Safe Admin Provisioning Script for Hirevoxa
 *
 * Usage:
 *   node src/scripts/bootstrapAdmin.js --email owner@hirevoxa.internal --name "Primary Owner" --password "StrongPass#2026!"
 *
 * Requirements:
 * - Never ships default hardcoded passwords.
 * - Password must be at least 10 chars, have numbers and special characters.
 * - Records bootstrap in Audit Log.
 * - Cannot create duplicate owners.
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB, disconnectDB, getDbMode } from '../config/db.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { inMemoryStore } from '../services/inMemoryStore.js';

dotenv.config();

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      parsed[key] = val;
    }
  }
  return parsed;
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 10) return false;
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  return hasDigit && hasSpecial;
}

async function runBootstrap() {
  console.log('--- HIREVOXA SECURE PLATFORM OWNER BOOTSTRAP ---');
  const args = parseArgs();
  const email = (args.email || '').trim().toLowerCase();
  const name = (args.name || 'Platform Owner').trim();
  const password = args.password;

  if (!email || !email.includes('@')) {
    console.error('ERROR: A valid --email argument is required.');
    process.exit(1);
  }

  if (!validatePassword(password)) {
    console.error('ERROR: Password must be at least 10 characters long and contain at least one number and one special character.');
    process.exit(1);
  }

  if (args.demo || args['in-memory']) {
    process.env.ALLOW_IN_MEMORY_DEMO = 'true';
  }

  await connectDB();
  const mode = getDbMode();
  console.log(`[Bootstrap] Connected to database. Mode: ${mode}`);

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (mode === 'in-memory-demo') {
      const existing = await inMemoryStore.findUserByEmail(email);
      if (existing) {
        if (existing.adminRole === 'owner') {
          console.log(`[Bootstrap] Owner account ${email} already exists.`);
          await disconnectDB();
          process.exit(0);
        }
        existing.role = 'admin';
        existing.adminRole = 'owner';
        existing.status = 'active';
        existing.password = hashedPassword;
        console.log(`[Bootstrap] Successfully updated ${email} to Platform Owner role.`);
      } else {
        const newUser = {
          _id: `usr-admin-${crypto.randomUUID()}`,
          name,
          email,
          password: hashedPassword,
          role: 'admin',
          adminRole: 'owner',
          status: 'active',
          companyName: 'Hirevoxa Ops',
          companyId: '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        inMemoryStore.users.push(newUser);
        console.log(`[Bootstrap] Successfully created Platform Owner account: ${email}`);
      }

      await inMemoryStore.createAuditLog({
        actorId: 'CLI_BOOTSTRAP',
        actorEmail: email,
        actorRole: 'owner',
        action: 'ADMIN_BOOTSTRAP',
        targetType: 'SYSTEM',
        targetId: email,
        outcome: 'SUCCESS',
        metadata: { name }
      });
    } else {
      let user = await User.findOne({ email });
      if (user) {
        if (user.adminRole === 'owner') {
          console.log(`[Bootstrap] Owner account ${email} already exists.`);
          await disconnectDB();
          process.exit(0);
        }
        user.role = 'admin';
        user.adminRole = 'owner';
        user.status = 'active';
        user.password = password; // Let Mongoose pre-save hook hash it once
        await user.save();
        console.log(`[Bootstrap] Promoted existing user ${email} to Platform Owner.`);
      } else {
        user = await User.create({
          name,
          email,
          password, // Let Mongoose pre-save hook hash it once
          role: 'admin',
          adminRole: 'owner',
          status: 'active',
          companyName: 'Hirevoxa Ops',
          companyId: ''
        });
        console.log(`[Bootstrap] Successfully created Platform Owner: ${email}`);
      }

      await AuditLog.create({
        actorId: 'CLI_BOOTSTRAP',
        actorEmail: email,
        actorRole: 'owner',
        action: 'ADMIN_BOOTSTRAP',
        targetType: 'System',
        targetId: user._id.toString(),
        outcome: 'success',
        details: { name }
      });
    }

    console.log('[Bootstrap] Admin provisioning completed securely.');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error(`[Bootstrap ERROR] ${err.message}`);
    await disconnectDB();
    process.exit(1);
  }
}

runBootstrap();
