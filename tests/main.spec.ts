/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
import { Container, createTestBed } from '@rxdi/core';
import { spawn } from 'child_process';
import { exists, readFile, rmdir, unlink, writeFile } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

import { DEFAULT_CONFIG } from '../src/default.config';
import { ensureDir, LogFactory } from '../src/helpers';
import { Config, LoggerConfig } from '../src/injection.tokens';
import { ConfigService } from '../src/services/config/config.service';
import { DatabaseService } from '../src/services/database/database.service';
import { GenericRunner } from '../src/services/generic-runner/generic-runner.service';
import { MigrationService } from '../src/services/migration/migration.service';
import { MigrationsResolver } from '../src/services/migrations-resolver/migrations-resolver.service';
import {
  FakeMongoClient,
  FakeMongoClientErrorWhenInsertingCollection,
} from './helpers/fake-mongo';

export const xmigrate = (args: string[]) => {
  return new Promise((resolve) => {
    const child = spawn('node', ['./dist/main.js', ...args]);
    // child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.on('close', (code) => {
      if (code !== 0) {
        throw new Error();
      }
      resolve();
    });
  });
};

const template = `
import { MongoClient } from 'mongodb';

export async function up(client: MongoClient) {
  return await client
    .db()
    .collection('albums')
    .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: true } });
}
export async function down(client: MongoClient) {
  return await client
    .db()
    .collection('albums')
    .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: false } });
}
`;

const ErrorTemplate = `
import { MongoClient } from 'mongodb';

export async function up(client: MongoClient) {
  throw new Error('This is error from UP migration')
  return await client
    .db()
    .collection('albums')
    .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: true } });
}
export async function down(client: MongoClient) {
  throw new Error('This is error from DOWN migration')
  return await client
    .db()
    .collection('albums')
    .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: false } });
}
`;

describe('Global Xmigrate Tests', () => {
  const config: Config = DEFAULT_CONFIG;
  let migrationResolver: MigrationsResolver;
  let databaseService: DatabaseService;
  let migrationService: MigrationService;
  let logFactory: LogFactory;

  const cwd = process.cwd();

  async function TestMigration(type: 'up' | 'down', response: boolean) {
    await migrationService.createWithTemplate(
      template as 'typescript',
      'pesho1234',
      { raw: true, typescript: true },
    );
    const fileNames = await migrationResolver.getFileNames();
    expect(fileNames.length).toBe(1);
    await migrationResolver.transpileMigrations(fileNames);
    const migration = await migrationResolver.loadMigration(fileNames[0]);
    const spy = spyOn(databaseService, 'connect').and.callFake(() =>
      FakeMongoClient(response),
    );
    const res: any = await migration[type](await databaseService.connect());
    expect(res['response']).toEqual(response);
    expect(spy).toHaveBeenCalled();
    await migrationResolver.delete(migrationResolver.getFilePath(fileNames[0]));
    await migrationResolver.delete(
      migrationResolver.getTsCompiledFilePath(fileNames[0]),
    );
    await migrationResolver.delete(
      migrationResolver.getTsCompiledFilePath(`${fileNames[0]}.map`),
    );
    expect((await migrationResolver.getFileNames()).length).toEqual(0);
    expect((await migrationResolver.getDistFileNames()).length).toEqual(0);
  }

  async function cleanStage() {
    const files = await migrationResolver.getFileNames();
    const filesDist = (await migrationResolver.getDistFileNames()).filter(
      (f) => !f.includes('main'),
    );
    await Promise.all(
      files.map((f) =>
        migrationResolver.delete(migrationResolver.getFilePath(f)),
      ),
    );
    await Promise.all(
      filesDist.map((f) =>
        migrationResolver.delete(migrationResolver.getTsCompiledFilePath(f)),
      ),
    );
  }

  async function StartMigration(type: 'up' | 'down') {
    const filePath = await migrationService.createWithTemplate(
      template as 'typescript',
      'pesho1234',
      { raw: true, typescript: true },
    );
    const spy = spyOn(migrationService, 'connect').and.callFake(() =>
      FakeMongoClient({ up: true }),
    );

    const [file] = await migrationResolver.getFileNames();
    const fakeMigration = [
      {
        fileName: file,
        appliedAt: type === 'up' ? 'PENDING' : new Date(),
        result: { up: true },
      },
    ];
    const spyStatus = spyOn(migrationService, 'statusInternal').and.callFake(
      () => fakeMigration,
    );
    expect(migrationResolver.getRelativePath(file)).toEqual(filePath);
    const [item] = await migrationService[type]();
    expect(spy).toHaveBeenCalled();
    expect(spyStatus).toHaveBeenCalled();
    expect(item.fileName).toEqual(fakeMigration[0].fileName);
    expect(item.result.response).toEqual(fakeMigration[0].result);
  }

  async function StartMigrationWithCrash(type: 'up' | 'down') {
    const spy = spyOn(migrationService, 'connect').and.callFake(() =>
      FakeMongoClient({ up: true }),
    );
    try {
      await migrationService[type]();
    } catch (e) {}
    expect(spy).toHaveBeenCalled();
  }

  beforeAll(async () => {
    await ensureDir('./migrations');
    await ensureDir('./migrations-log');
    await ensureDir('./.xmigrate');
  });

  beforeAll(async () => {
    await createTestBed({
      providers: [
        GenericRunner,
        LogFactory,
        ConfigService,
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
    migrationResolver = Container.get(MigrationsResolver);
    databaseService = Container.get(DatabaseService);
    migrationService = Container.get(MigrationService);
    logFactory = Container.get(LogFactory);
  });

  afterEach(async () => await cleanStage());
  afterEach(async () => {
    await logFactory.closeConnections();
    await databaseService.close();
    await logFactory.closeConnections();
  });

  it('Should inject appropriate config', async () => {
    expect(Container.get(Config)).toEqual(DEFAULT_CONFIG);
  });

  it('Should create init file with default values', async () => {
    await migrationService.init();
    const file = await require(join(cwd, './xmigrate.js'))();
    expect(Container.get(Config)).toEqual(file);
    expect(file).toEqual(DEFAULT_CONFIG);
    migrationResolver.delete(join(cwd, './xmigrate.js'));
  });

  it('Should create init file with .gitignore', async () => {
    const gitIgnore = await promisify(readFile)('./.gitignore', {
      encoding: 'utf-8',
    });
    await promisify(writeFile)('./.gitignore-temp', gitIgnore, {
      encoding: 'utf-8',
    });
    await promisify(unlink)('./.gitignore');
    await promisify(writeFile)('./.gitignore', { encoding: 'utf-8' }, '');
    await migrationService.init();
    const file = await require(join(cwd, './xmigrate.js'))();
    expect(Container.get(Config)).toEqual(file);
    expect(file).toEqual(DEFAULT_CONFIG);
    migrationResolver.delete(join(cwd, './xmigrate.js'));
    await promisify(unlink)('./.gitignore');
    await promisify(unlink)('./.gitignore-temp');
    await promisify(writeFile)('./.gitignore', gitIgnore, {
      encoding: 'utf-8',
    });
  });

  it('Should have no files inside migrations folder', async () => {
    expect((await migrationResolver.getFileNames()).length).toBe(0);
  });

  it('Should create migration and delete it', async () => {
    const filePath = await migrationService.createWithTemplate(
      'typescript',
      'pesho1234',
    );
    const [file] = await migrationResolver.getFileNames();
    expect(migrationResolver.getRelativePath(file)).toEqual(filePath);
    await migrationResolver.delete(migrationResolver.getFilePath(file));
    expect((await migrationResolver.getFileNames()).length).toEqual(0);
  });

  it('Should create ES6 migration and load it', async () => {
    const filePath = await migrationService.createWithTemplate(
      'es6',
      'pesho1234',
    );
    const [file] = await migrationResolver.getFileNames();
    expect(migrationResolver.getRelativePath(file)).toEqual(filePath);
    const migration = await migrationResolver.loadMigration(file);
    expect(migration.up).toBeDefined();
    expect(migration.down).toBeDefined();
    await migrationResolver.delete(migrationResolver.getFilePath(file));
    expect((await migrationResolver.getFileNames()).length).toEqual(0);
  });

  it.skip('Should create migration and run UP', async () =>
    await TestMigration('up', true));

  it.skip('Should create migration and run DOWN', async () =>
    await TestMigration('down', false));

  it.skip('Should create migration and test complete flow UP migration', async () =>
    StartMigration('up'));

  it.skip('Should create migration and test complete flow DOWN migration', async () =>
    StartMigration('down'));

  it('Should crash UP migration', async () => {
    StartMigrationWithCrash('down');
  });

  it('Should create migration and try to get status PENDING', async () => {
    const filePath = await migrationService.createWithTemplate(
      'typescript',
      'pesho1234',
    );
    const spy = spyOn(migrationService, 'connect').and.callFake(() =>
      FakeMongoClient({ up: true }),
    );
    const res = await migrationService.status();
    expect(spy).toHaveBeenCalled();
    expect(filePath).toBeTruthy();
    expect(res.status).toBeTruthy();
    expect(res.result.length).toBe(1);
    expect(res.result[0].fileName.includes('pesho1234')).toBeTruthy();
    expect(res.result[0].appliedAt).toBe('PENDING');
    const isFileExists = await promisify(exists)(
      migrationResolver.getFilePath(res.result[0].fileName),
    );
    expect(isFileExists).toBeTruthy();
  });

  it('Should create migration and try to get status to "Migrated"', async () => {
    const appliedAt = new Date('2017-06-13T04:41:20');
    const mongoFake = FakeMongoClient({ up: true }, [
      {
        fileName: '20190728192825-pesho1234.js',
        appliedAt,
        result: {},
      },
    ]);
    const spy = spyOn(migrationService, 'connect').and.callFake(
      () => mongoFake,
    );

    const spyResolver = spyOn(
      migrationResolver,
      'getFileNames',
    ).and.callFake(() => ['20190728192825-pesho1234.js']);
    const res = await migrationService.statusInternal();
    expect(`${new Date(res[0].appliedAt)}`).toBe(`${appliedAt}`);
    expect(spy).toHaveBeenCalled();
    expect(spyResolver).toHaveBeenCalled();
  });

  it('Should test printStatus method', async () => {
    const spy = spyOn(console, 'log');
    await migrationService.printStatus([
      { appliedAt: new Date(), fileName: 'dada', result: [] },
    ]);
    expect(spy).toHaveBeenCalled();
  });

  it('Should test printStatus table method', async () => {
    const spy = spyOn(console, 'log');
    await migrationService.printStatus(
      [{ appliedAt: new Date(), fileName: 'dada', result: [] }],
      'table',
    );
    expect(spy).toHaveBeenCalled();
  });

  it('Should create template and createWithTemplate method should be called', async () => {
    const spy = spyOn(console, 'log');
    const spyCreateWithTemplate = spyOn(
      migrationService,
      'createWithTemplate',
    ).and.callFake(() => 'pesho');
    await migrationService.create({ name: 'pesho', template: 'typescript' });
    expect(spy).toHaveBeenCalled();
    expect(spyCreateWithTemplate).toHaveBeenCalled();
  });

  it('Should create template and createWithTemplate method should be called', async () => {
    const spy = spyOn(console, 'log');
    const spyCreateWithTemplate = spyOn(
      migrationService,
      'createWithTemplate',
    ).and.callFake(() => 'pesho');
    await migrationService.create({ name: 'pesho' } as never);
    expect(spy).toHaveBeenCalled();
    expect(spyCreateWithTemplate).toHaveBeenCalled();
  });

  it('Should throw error if provided template is missing', async () => {
    try {
      await migrationService.create({
        name: 'pesho',
        template: 'typescript2' as never,
      });
    } catch (e) {
      expect(e.message).toBe(`🔥  *** Missing template typescript2 ***`);
    }
  });

  // Refactor to single method
  it.skip('Should check if UP will throw error when executed', async () => {
    await migrationService.createWithTemplate(
      ErrorTemplate as 'typescript',
      'pesho1234',
      { raw: true, typescript: true },
    );
    const fileNames = await migrationResolver.getFileNames();
    expect(fileNames.length).toBe(1);
    await migrationResolver.transpileMigrations(fileNames);
    const migration = await migrationResolver.loadMigration(fileNames[0]);
    const spy = spyOn(databaseService, 'connect').and.callFake(() =>
      FakeMongoClient(true),
    );
    try {
      await migration.up(await databaseService.connect());
    } catch (e) {
      expect(spy).toHaveBeenCalled();
      expect(e.message).toBe('This is error from UP migration');
    }
    await migrationResolver.delete(migrationResolver.getFilePath(fileNames[0]));
    await migrationResolver.delete(
      migrationResolver.getTsCompiledFilePath(fileNames[0]),
    );
    await migrationResolver.delete(
      migrationResolver.getTsCompiledFilePath(`${fileNames[0]}.map`),
    );
  });

  // Refactor to single method
  it.skip('Should check if DOWN will throw error when executed', async () => {
    await migrationService.createWithTemplate(
      ErrorTemplate as 'typescript',
      'pesho1234',
      { raw: true, typescript: true },
    );
    const fileNames = await migrationResolver.getFileNames();
    expect(fileNames.length).toBe(1);
    await migrationResolver.transpileMigrations(fileNames);
    const migration = await migrationResolver.loadMigration(fileNames[0]);
    const spy = spyOn(databaseService, 'connect').and.callFake(() =>
      FakeMongoClient(true),
    );
    try {
      await migration.down(await databaseService.connect());
    } catch (e) {
      expect(spy).toHaveBeenCalled();
      expect(e.message).toBe('This is error from DOWN migration');
    }
    await migrationResolver.delete(migrationResolver.getFilePath(fileNames[0]));
    await migrationResolver.delete(
      migrationResolver.getTsCompiledFilePath(fileNames[0]),
    );
    await migrationResolver.delete(
      migrationResolver.getTsCompiledFilePath(`${fileNames[0]}.map`),
    );
  });

  it.skip('Should check if UP will throw with specific context', async () => {
    await migrationService.createWithTemplate(
      ErrorTemplate as 'typescript',
      'pesho1234',
      { raw: true, typescript: true },
    );
    const spy = spyOn(migrationService, 'connect').and.callFake(() =>
      FakeMongoClient(true),
    );
    try {
      await migrationService.up();
    } catch (e) {
      expect(spy).toHaveBeenCalled();
      expect(e.message).toBe('This is error from UP migration');
    }
    const fileNames = await migrationResolver.getFileNames();
    await migrationResolver.delete(migrationResolver.getFilePath(fileNames[0]));
    await migrationResolver.delete(
      migrationResolver.getTsCompiledFilePath(fileNames[0]),
    );
    await migrationResolver.delete(
      migrationResolver.getTsCompiledFilePath(`${fileNames[0]}.map`),
    );
  });

  it.skip('Should throw error UP when inserting to mongo collection "Could not update changelog"', async () => {
    await migrationService.createWithTemplate(
      template as 'typescript',
      'pesho1234',
      { raw: true, typescript: true },
    );
    const spy = spyOn(migrationService, 'connect').and.callFake(() =>
      FakeMongoClientErrorWhenInsertingCollection(true),
    );

    try {
      await migrationService.up();
    } catch (e) {
      expect(spy).toHaveBeenCalled();
      expect(e.message).toBe(
        'Could not update changelog: Cannot insert inside this mongo collection',
      );
    }
    const fileNames = await migrationResolver.getFileNames();
    await migrationResolver.delete(migrationResolver.getFilePath(fileNames[0]));
    await migrationResolver.delete(
      migrationResolver.getTsCompiledFilePath(fileNames[0]),
    );
    await migrationResolver.delete(
      migrationResolver.getTsCompiledFilePath(`${fileNames[0]}.map`),
    );
  });

  it('Should check if DOWN will throw with specific context', async () => {
    await migrationService.createWithTemplate(
      ErrorTemplate as 'typescript',
      'pesho1234',
      { raw: true, typescript: true },
    );
    const spy = spyOn(migrationService, 'connect').and.callFake(() =>
      FakeMongoClient(true),
    );
    try {
      await migrationService.down();
    } catch (e) {
      expect(spy).toHaveBeenCalled();
      expect(e.message).toBe('This is error from DOWN migration');
    }
    const fileNames = await migrationResolver.getFileNames();
    await migrationResolver.delete(migrationResolver.getFilePath(fileNames[0]));
    await migrationResolver.delete(
      migrationResolver.getTsCompiledFilePath(fileNames[0]),
    );
    await migrationResolver.delete(
      migrationResolver.getTsCompiledFilePath(`${fileNames[0]}.map`),
    );
  });

  it('Should throw error DOWN when inserting to mongo collection "Could not update changelog"', async () => {
    const spy = spyOn(migrationService, 'connect').and.callFake(() =>
      FakeMongoClientErrorWhenInsertingCollection(true, [
        {
          fileName: '20190728192825-pesho1234.js',
          appliedAt: new Date(),
          result: {},
        },
      ]),
    );

    const spyResolver = spyOn(
      migrationResolver,
      'getFileNames',
    ).and.callFake(() => ['20190728192825-pesho1234.js']);

    const spyLoad = spyOn(
      migrationResolver,
      'loadMigration',
    ).and.callFake(() => ({ down: async () => ({}) }));
    try {
      await migrationService.down();
    } catch (e) {
      expect(e.message).toBe(
        'Could not update changelog: Cannot delete inside this mongo collection',
      );
    }
    expect(spy).toHaveBeenCalled();
    expect(spyResolver).toHaveBeenCalled();
    expect(spyLoad).toHaveBeenCalled();
  });

  it('Should throw custom error DOWN "', async () => {
    const spy = spyOn(migrationService, 'connect').and.callFake(() =>
      FakeMongoClientErrorWhenInsertingCollection(true, [
        {
          fileName: '20190728192825-pesho1234.js',
          appliedAt: new Date(),
          result: {},
        },
      ]),
    );

    const spyResolver = spyOn(
      migrationResolver,
      'getFileNames',
    ).and.callFake(() => ['20190728192825-pesho1234.js']);

    const spyLoad = spyOn(migrationResolver, 'loadMigration').and.callFake(
      () => ({
        down: async () => {
          throw new Error('test');
        },
      }),
    );
    try {
      await migrationService.down();
    } catch (e) {
      expect(e.message).toBe('test');
    }
    expect(spy).toHaveBeenCalled();
    expect(spyResolver).toHaveBeenCalled();
    expect(spyLoad).toHaveBeenCalled();
    const fileNames = await migrationResolver.getFileNames();
    await migrationResolver.delete(migrationResolver.getFilePath(fileNames[0]));
    await migrationResolver.delete(
      migrationResolver.getTsCompiledFilePath(fileNames[0]),
    );
    await migrationResolver.delete(
      migrationResolver.getTsCompiledFilePath(`${fileNames[0]}.map`),
    );
  });

  afterAll(async () => {
    expect((await migrationResolver.getFileNames()).length).toEqual(0);
    try {
      await promisify(rmdir)(join(process.cwd(), config.outDir));
    } catch (e) {}
  });
});
