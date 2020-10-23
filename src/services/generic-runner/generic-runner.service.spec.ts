import { Container, createTestBed } from '@rxdi/core';

import { Config, LoggerConfig } from '../../injection.tokens';
import { GenericRunner } from './generic-runner.service';

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
describe.skip('Generic runner', () => {
  let runner: GenericRunner;
  beforeEach(async () => {
    await createTestBed({
      providers: [
        GenericRunner,
        {
          provide: Config,
          useValue: config,
        },
        {
          provide: LoggerConfig,
          useValue: config.logger,
        },
      ],
    });
    runner = Container.get(GenericRunner);
    runner.setTasks([]);
  });

  it('Should run task up', async () => {
    runner.setTasks([['up', () => 'up']]);
    const result = await runner.run('up');
    console.log(result);
  });
});
