import { Container, setup } from '@rxdi/core';

import {
  MigrationService,
  GenericRunner,
  LogFactory,
  ConfigService,
  LoggerConfig,
  Config
} from '../src/index'; // equivalent to '@rxdi/xmigrate'

const config = {
  changelogCollectionName: 'migrations',
  migrationsDir: 'migrations',
  defaultTemplate: 'typescript',
  typescript: true,
  outDir: './.xmigrate',
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
  mongodb: {
    url: 'mongodb://localhost:27017',
    databaseName: 'test',
    options: {
      useNewUrlParser: true
    }
  }
};

setup({
  providers: [
    GenericRunner,
    LogFactory,
    ConfigService,
    {
      provide: Config,
      useValue: config
    },
    {
      provide: LoggerConfig,
      useValue: config.logger
    }
  ]
}).subscribe(async () => {
  const template = `
import { MongoClient } from 'mongodb';

export async function up(client: MongoClient) {
  return true
}
export async function down(client: MongoClient) {
  return true
}
`;

  const migrationService = Container.get(MigrationService);

  // Create migration with template
  const filePath = await migrationService.createWithTemplate(
    template as 'typescript',
    'pesho1234',
    { raw: true, typescript: true }
  );
  console.log(filePath);

  // Up migration
  await migrationService.up();
  process.exit(0);

  // Down migration
  await migrationService.down();
  process.exit(0);

  // Status
  await migrationService.status();

  process.exit(0);
}, console.error.bind(console));
