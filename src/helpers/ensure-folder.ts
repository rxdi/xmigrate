import { mkdir } from 'fs';
import { promisify } from 'util';

export async function ensureDir(dirpath: string) {
  try {
    await promisify(mkdir)(dirpath, { recursive: true });
  } catch (err) {}
}
