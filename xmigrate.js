module.exports = async () => {
  return {
    changelogCollectionName: 'migrations',
    migrationsDir: 'migrations',
    defaultTemplate: 'typescript',
    outDir: 'dist',
    typescript: true,
    logger: {
      folder: 'migrations-log'
    },
    mongodb: {
      url: 'mongodb://localhost:27017',
      databaseName: 'testdd',
      options: {
        useNewUrlParser: true
      }
    }
  };
};
