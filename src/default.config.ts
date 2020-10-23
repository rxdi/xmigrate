import { Config } from './injection.tokens';

export const DEFAULT_CONFIG: Config = {
  changelogCollectionName: 'migrations',
  migrationsDir: 'migrations',
  defaultTemplate: 'es6',
  typescript: true,
  outDir: './.xmigrate',
  // dateTimeFormat: () => '1212',
  logger: {
    folder: './migrations-log',
    up: {
      success: 'up.success.log',
      error: 'up.error.log',
    },
    down: {
      success: 'down.success.log',
      error: 'down.error.log',
    },
  },
  mongodb: {
    url: 'mongodb://localhost:27017',
    databaseName: 'test',
    options: {
      useNewUrlParser: true,
    },
  },
};
