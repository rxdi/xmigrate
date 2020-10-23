import { Container, createTestBed } from '@rxdi/core';

import { Config, LoggerConfig } from '../../injection.tokens';
import { DatabaseService } from '../database/database.service';
import { MigrationService } from './migration.service';

const config = {
  changelogCollectionName: 'migrations',
  migrationsDir: './migrations',
  defaultTemplate: 'es6',
  typescript: true,
  outDir: './.xmigrate',
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
    url: `mongodb://localhost:27017`,
    databaseName: 'test',
    options: {
      useNewUrlParser: true,
    },
  },
};
describe('Migration Service', () => {
  let migrationService: MigrationService;
  let databaseService: DatabaseService;
  beforeAll(
    async () =>
      await createTestBed({
        providers: [
          MigrationService,
          DatabaseService,
          {
            provide: Config,
            useValue: config,
          },
          {
            provide: LoggerConfig,
            useValue: config.logger,
          },
        ],
      }),
  );
  beforeEach(async () => {
    migrationService = Container.get(MigrationService);
    databaseService = Container.get(DatabaseService);
  });

  it('Should connect to mongoose and mongodb with single connect method', async () => {
    const spyMongo = spyOn(databaseService, 'connect').and.callFake(() => ({}));
    const spyMongoose = spyOn(
      databaseService,
      'mongooseConnect',
    ).and.callFake(() => () => ({}));
    await migrationService.connect();
    expect(spyMongo).toHaveBeenCalled();
    expect(spyMongoose).toHaveBeenCalled();
  });
});
