import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const storageRoot = process.env.RESUME_STORAGE_DIR
  ? path.resolve(process.env.RESUME_STORAGE_DIR)
  : path.join(process.cwd(), 'storage', 'resumes');

export function getResumeStorageMode() {
  return 'private-local';
}

export async function saveResume(buffer, extension) {
  await fs.mkdir(storageRoot, { recursive: true });
  const storageKey = `${randomUUID()}.${extension}`;
  const filePath = path.join(storageRoot, storageKey);
  await fs.writeFile(filePath, buffer, { flag: 'wx' });
  return { storageKey, filePath };
}

export async function readResume(storageKey) {
  const safeKey = path.basename(storageKey);
  if (safeKey !== storageKey || safeKey.includes('..')) {
    throw new Error('Invalid resume storage key');
  }
  return fs.readFile(path.join(storageRoot, safeKey));
}

export async function deleteResumeFile(storageKey) {
  if (!storageKey) return;
  const safeKey = path.basename(storageKey);
  if (safeKey !== storageKey || safeKey.includes('..')) return;
  await fs.rm(path.join(storageRoot, safeKey), { force: true });
}

export { storageRoot };
