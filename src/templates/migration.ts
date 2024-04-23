export default `module.exports = async () => {
  return {
    changelogCollectionName: 'migrations',
    migrationsDir: 'migrations',
    defaultTemplate: 'es6',
    outDir: './.xmigrate',
    typescript: true,
    // bundler: {
    //   build(entryPoints: string[], outdir: string) {
    //     return esbuild.build({
    //       entryPoints,
    //       bundle: true,
    //       sourcemap: false,
    //       minify: false,
    //       platform: 'node',
    //       format: 'cjs',
    //       outdir,
    //       logLevel: 'info',
    //       plugins: [pluginTsc()],
    //     })
    //   },
    // },
    logger: {
      folder: './migrations-log',
      up: {
        success: 'up.success.log',
        error: 'up.error.log'
      },
      down: {
        success: 'down.success.log',
        error: 'down.error.log'
      }
    },
    database: {
      async connect() {
        const url =
          process.env.MONGODB_CONNECTION_STRING ?? 'mongodb://localhost:27017'

        await connect(url)
        const client = await MongoClient.connect(url)
        return client
      },
    },
  };
};
`;
