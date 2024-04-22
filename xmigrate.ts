import esbuild from 'esbuild';
import pluginTsc from 'esbuild-plugin-tsc';

export default async () => {
  return {
    defaultTemplate: 'typescript',
    outDir: './.xmigrate',
    typescript: true,
    builder: 'custom',
    bundler: {
      build(entryPoints: string[], outdir: string) {
        return esbuild.build({
          entryPoints,
          bundle: true,
          sourcemap: true,
          minify: false,
          platform: 'node',
          format: 'cjs',
          outdir,
          logLevel: 'info',
          plugins: [pluginTsc()],
        });
      },
    },
    // dateTimeFormat: () => new Date().toISOString(),
    mongodb: {
      url: 'mongodb://localhost:27017',
      databaseName: 'test',
      options: {
        useNewUrlParser: true,
      },
    },
  };
};
