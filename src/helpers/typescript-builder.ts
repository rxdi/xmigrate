import { exit } from 'process';

export const TranspileTypescript = async (
  entryPoints: string[],
  outdir: string,
) => {
  try {
    return await (await import('esbuild')).build({
      entryPoints,
      bundle: false,
      sourcemap: false,
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
