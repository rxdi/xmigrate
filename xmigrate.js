export default async () => {
  return {
    defaultTemplate: 'typescript',
    outDir: 'dist',
    typescript: true,
    mongodb: {
      url: 'mongodb://localhost:27017',
      databaseName: 'tesd',
      options: {
        useNewUrlParser: true
      }
    }
  };
};
