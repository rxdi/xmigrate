import { spawn } from 'child_process';
import { exit } from 'process';

/* Deprecated */
export const TranspileTypescript = (entryPoints: string[], outdir: string) => {
  console.warn(
    '***Deprecated Warning*** using `gapi` as a build for migrations is deprecated consider using builder type esbuild',
  );
  return new Promise((resolve) => {
    const child = spawn('npx', [
      'gapi',
      'build',
      '--glob',
      `${entryPoints.toString()}`,
      '--outDir',
      outdir,
    ]);
    // child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.on('close', (code: number) => resolve(code));
  });
};

export const TranspileTypescriptESBuild = async (
  entryPoints: string[],
  outdir: string,
) => {
  try {
    return (await import('esbuild')).build({
      entryPoints,
      bundle: true,
      sourcemap: true,
      minify: false,
      platform: 'node',
      format: 'cjs',
      outdir,
      logLevel: 'info',
    });
  } catch (e) {
    console.error(e);
    exit(1);
  }
};
