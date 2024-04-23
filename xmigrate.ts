// import esbuild from 'esbuild';
import { MongoClient } from 'mongodb';
import { connect } from 'mongoose';

export default async () => {
  return {
    defaultTemplate: 'typescript',
    outDir: './.xmigrate',
    typescript: true,
    builder: 'custom',
    /* If bundler is not set default esbuild configuration will be added */
    // bundler: {
    //   build(entryPoints: string[], outdir: string) {
    //     return esbuild.build({
    //       entryPoints,
    //       bundle: true,
    //       sourcemap: true,
    //       minify: false,
    //       platform: 'node',
    //       format: 'cjs',
    //       outdir,
    //       logLevel: 'info',
    //     });
    //   },
    // },
    // dateTimeFormat: () => new Date().toISOString(),
    database: {
      async connect() {
        const url = 'mongodb://localhost:27017';
        await connect(url);
        const client = await MongoClient.connect(url);
        return client;
      },
    },
  };
};
