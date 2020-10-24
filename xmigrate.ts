export default async () => {
  return {
    defaultTemplate: 'typescript',
    outDir: './.xmigrate',
    typescript: true,
    hooks: {
      connection: () => {
        return {
          db: () => ({ collection: () => ({ updateOne: () => null }) }),
        };
      },
      up: (fileName: string) => {
        /* Save up migration */
        // Migrations.save({ fileName, createdAt: new Date() });
        console.log('up');
        return {};
      },
      down: (fileName: string) => {
        /* Remove migration from changelog */
        // Migrations.remove(fileName);
        console.log('down');
        return {};
      },
      status: (fileNames: string[]) => {
        /* Get all migrations from database */
        const prevMigrations = [
          { fileName: '2020102412521-pesho.ts', appliedAt: new Date() },
        ];
        return fileNames.map((fileName) => {
          const itemInLog = prevMigrations.find((m) => m.fileName === fileName);
          const appliedAt = itemInLog
            ? (itemInLog.appliedAt as Date).toJSON()
            : 'PENDING';
          return { fileName, appliedAt, result: null };
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
