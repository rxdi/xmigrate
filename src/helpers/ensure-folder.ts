import { promisify } from 'util';
import { mkdir } from 'fs';

export async function ensureDir(dirpath: string) {
  try {
    await promisify(mkdir)(dirpath, { recursive: true });
  } catch (err) {}
}
