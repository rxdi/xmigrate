import { spawn } from 'child_process';
import { Config, LoggerConfig } from '../src/injection.tokens';
import { DEFAULT_CONFIG } from '../src/default.config';
import { MigrationsResolver } from '../src/services/migrations-resolver/migrations-resolver.service';
import { createTestBed, Container } from '@rxdi/core';
import { GenericRunner } from '../src/services/generic-runner/generic-runner.service';
import { LogFactory, ensureDir } from '../src/helpers';
import { ConfigService } from '../src/services/config/config.service';
import { MigrationService } from '../src/services/migration/migration.service';
import { DatabaseService } from '../src/services/database/database.service';
import { join } from 'path';
import { promisify } from 'util';
import { rmdir } from 'fs';

export const xmigrate = (args: string[]) => {
  return new Promise(resolve => {
    const child = spawn('node', ['./dist/main.js', ...args]);
    // child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.on('close', code => {
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

function FakeMongoClient(response: unknown) {
  return {
    db: () => ({
      collection: () => ({
        insertOne: () => null,
        find: () => ({ toArray: () => [] }),
        updateOne: () => ({ response }),
        deleteOne: () => ({ response })
      })
    })
  };
}

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
      { raw: true, typescript: true }
    );
    const fileNames = await migrationResolver.getFileNames();
    expect(fileNames.length).toBe(1);
    await migrationResolver.transpileMigrations(fileNames);
    const migration = await migrationResolver.loadMigration(fileNames[0]);
    const spy = spyOn(databaseService, 'connect').and.callFake(() =>
      FakeMongoClient(response)
    );
    const res = await migration[type](await databaseService.connect());
    expect(res['response']).toEqual(response);
    expect(spy).toHaveBeenCalled();
    await migrationResolver.delete(migrationResolver.getFilePath(fileNames[0]));
    await migrationResolver.delete(
      migrationResolver.getTsCompiledFilePath(fileNames[0])
    );
    await migrationResolver.delete(
      migrationResolver.getTsCompiledFilePath(`${fileNames[0]}.map`)
    );
    expect((await migrationResolver.getFileNames()).length).toEqual(0);
    expect((await migrationResolver.getDistFileNames()).length).toEqual(0);
  }

  async function cleanStage() {
    const files = await migrationResolver.getFileNames();
    const filesDist = (await migrationResolver.getDistFileNames()).filter(
      f => !f.includes('main')
    );
    await Promise.all(
      files.map(f => migrationResolver.delete(migrationResolver.getFilePath(f)))
    );
    await Promise.all(
      filesDist.map(f =>
        migrationResolver.delete(migrationResolver.getTsCompiledFilePath(f))
      )
    );
  }

  async function StartMigration(type: 'up' | 'down') {
    const filePath = await migrationService.createWithTemplate(
      template as 'typescript',
      'pesho1234',
      { raw: true, typescript: true }
    );
    const spy = spyOn(migrationService, 'connect').and.callFake(() =>
      FakeMongoClient({ up: true })
    );

    const [file] = await migrationResolver.getFileNames();
    const fakeMigration = [
      {
        fileName: file,
        appliedAt: type === 'up' ? 'PENDING' : new Date(),
        result: { up: true }
      }
    ];
    const spyStatus = spyOn(migrationService, 'statusInternal').and.callFake(
      () => fakeMigration
    );
    expect(migrationResolver.getRelativePath(file)).toEqual(filePath);
    const [item] = await migrationService[type]();
    expect(spy).toHaveBeenCalled();
    expect(spyStatus).toHaveBeenCalled();
    expect(item.fileName).toEqual(fakeMigration[0].fileName);
    expect(item.result.response).toEqual(fakeMigration[0].result);
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
          useValue: config
        },
        {
          provide: LoggerConfig,
          useValue: config.logger
        },
      ]
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

  it('Should have no files inside migrations folder', async () => {
    expect((await migrationResolver.getFileNames()).length).toBe(0);
  });

  it('Should create migration and delete it', async () => {
    const filePath = await migrationService.createWithTemplate(
      'typescript',
      'pesho1234'
    );
    const [file] = await migrationResolver.getFileNames();
    expect(migrationResolver.getRelativePath(file)).toEqual(filePath);
  });

  it('Should create migration and run UP', async () =>
    await TestMigration('up', true));
  it('Should create migration and run DOWN', async () =>
    await TestMigration('down', false));

  it('Should create migration and test complete flow UP migration', async () =>
    StartMigration('up'));

  it('Should create migration and test complete flow DOWN migration', async () =>
    StartMigration('down'));

  afterAll(async () => {
    expect((await migrationResolver.getFileNames()).length).toEqual(0);
    try {
      await promisify(rmdir)(
        join(process.cwd(), this.configService.config.outDir)
      );
    } catch (e) {}
  });
});