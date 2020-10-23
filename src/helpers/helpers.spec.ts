import { createTestBed } from '@rxdi/core';
import { unlink } from 'fs';
import { promisify } from 'util';

import { Config, LoggerConfig } from '../injection.tokens';
import { includes, nextOrDefault } from './args-extractors';
import { LogFactory } from './log-factory';

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

describe('Helpers', () => {
  beforeEach(async () => {
    await createTestBed({
      providers: [
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
  });
  it('Should set "es6" template when argument --template es6 present', async () => {
    expect(nextOrDefault('--template', 'typescript')).toBe('typescript');
    process.argv.push('--template');
    process.argv.push('es6');
    expect(nextOrDefault('--template', 'typescript')).toBe('es6');
    process.argv.pop();
    process.argv.pop();
  });

  it('Should set default template when no value present', async () => {
    expect(nextOrDefault('--template', 'typescript')).toBe('typescript');
  });

  it('Should set default property to be Oh yeah', async () => {
    process.argv.push('--template');
    process.argv.push('yes');
    expect(
      nextOrDefault('--template', 'typescript', (v) =>
        v === 'yes' ? 'Oh yeah' : 'Noo',
      ),
    ).toBe('Oh yeah');
    process.argv.pop();
    process.argv.pop();
  });

  it('Should set default property to be Noo', async () => {
    process.argv.push('--template');
    process.argv.push('no');
    expect(
      nextOrDefault('--template' as never, 'typescript', (v) =>
        v === 'yes' ? 'Oh yeah' : 'Noo',
      ),
    ).toBe('Noo');
    process.argv.pop();
    process.argv.pop();
  });

  it('Adding "up" argument should equal to true', () => {
    process.argv.push('up');
    expect(includes('up')).toBeTruthy();
    process.argv.pop();
  });

  it('Adding "up" argument should equal to true', () => {
    process.argv.push('down');
    expect(includes('down')).toBeTruthy();
    process.argv.pop();
  });

  it('Includes extractor method tests', () => {
    process.argv.push('up');
    expect(includes('up')).toBeTruthy();
    process.argv.pop();
  });

  it('Next or default will get default value provided when argument starts with "--"', () => {
    process.argv.push('up');
    process.argv.push('--');
    expect(nextOrDefault('up', 'gosho')).toBe('gosho');
    process.argv.pop();
    process.argv.pop();
  });

  it('Next or default will get default value when no argument provided', () => {
    process.argv.push('up');
    expect(nextOrDefault('up', 'gosho')).toBe('gosho');
    process.argv.pop();
  });

  it('Next or default will be true if no value is provided', () => {
    process.argv.push('up');
    expect(nextOrDefault('up')).toBe(true);
    process.argv.pop();
  });

  it('Should log error and execute error with logFactory', async () => {
    const logFactory = new LogFactory(config.logger);
    logFactory.create('pesho', {
      errorPath: './test.error.log',
      successPath: './test.succes.log',
    });
    logFactory.create('pesho', {
      errorPath: './test.error.log',
      successPath: './test.succes.log',
    });
    const log = logFactory.create('pesho', {
      errorPath: './test.error.log',
      successPath: './test.succes.log',
    });
    await log.error('omg');
    log.successFinished = true;
    await log.log('omg');
    await promisify(unlink)('./test.error.log');
    await promisify(unlink)('./test.succes.log');
  });
});
