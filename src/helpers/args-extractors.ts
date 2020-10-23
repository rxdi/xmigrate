import { Tasks } from '../injection.tokens';

export const includes = (i: Tasks) => process.argv.toString().includes(i);
export const nextOrDefault = (
  i: Tasks,
  fb: unknown = true,
  type = (p: string) => p,
) => {
  if (process.argv.toString().includes(i)) {
    const isNextArgumentPresent = process.argv[process.argv.indexOf(i) + 1];
    if (!isNextArgumentPresent) {
      return fb;
    }
    if (isNextArgumentPresent.includes('--')) {
      return fb;
    }
    return type(isNextArgumentPresent);
  }
  return fb;
};
