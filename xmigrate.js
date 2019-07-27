module.exports = async () => {
  return {
    defaultTemplate: 'typescript',
    outDir: './dist',
    typescript: true,
    logger: {
      folder: './migrations-log'
    },
    mongodb: {
      databaseName: 'test'
    }
  };
};
