import { Container, createTestBed } from '@rxdi/core';

import { FakeMongoClient, MongoClientMockUp } from '../../../tests/helpers';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from './database.service';

describe('Database service', () => {
  let database: DatabaseService;
  let config: ConfigService;

  beforeEach(async () => {
    await createTestBed({
      providers: [DatabaseService, ConfigService],
    });
    database = Container.get(DatabaseService);
    config = Container.get(ConfigService);
    config.set({
      outDir: '',
      mongodb: {
        url: 'mongodb://localhost:27017',
        databaseName: 'test',
        options: {
          useNewUrlParser: true,
        },
      },
    });
  });

  it('Should throw error not defining url', async () => {
    delete config.config.mongodb.url;
    try {
      await database.connect();
    } catch (e) {
      expect(e.message).toBe('No `url` defined in config file!');
    }
  });

  it('Should throw error not defining database name', async () => {
    delete config.config.mongodb.databaseName;
    try {
      await database.connect();
    } catch (e) {
      expect(e.message).toBe(
        'No `databaseName` defined in config file! This is required since migrate-mongo v3. ' +
          'See https://github.com/seppevs/migrate-mongo#initialize-a-new-project',
      );
    }
  });

  it('Should connect to database and return mongo client', async () => {
    const spy = spyOn(database, 'getMongoClient').and.callFake(
      () => new MongoClientMockUp(true, 'pesho'),
    );
    const connection = await database.connect();
    expect(connection.db).toBeTruthy();
    expect([...database.connections.keys()].length).toBe(1);
    expect(connection.db().databaseName).toBe(undefined);
    expect(connection).toBeInstanceOf(MongoClientMockUp);
    expect(spy).toHaveBeenCalled();
  });

  it('Should get mongo client', async () => {
    const spy = spyOn(database, 'getMongoClient').and.callFake(
      () => new MongoClientMockUp(true, 'pesho'),
    );
    const connection = await database.getMongoClient();
    expect(connection).toBeInstanceOf(MongoClientMockUp);
    expect(spy).toHaveBeenCalled();
  });

  it('Should get mongo client', async () => {
    const connection = await database.getMongoClient();
    expect(connection).toBeInstanceOf(Function);
  });

  it('Should connect with mongoose', async () => {
    const spy = spyOn(database, 'connectMongoose').and.callFake(() => () => ({
      disconnect: () => {
        return;
      },
    }));
    const connection = await database.mongooseConnect();
    database.closeMongoose();
    expect(spy).toHaveBeenCalled();
    expect(connection).toBeInstanceOf(Object);
  });

  it('Should disconnect from mongodb', async () => {
    const connection = await database.connections.set(
      'dada',
      FakeMongoClient(true) as never,
    );
    database.close();
    expect(connection).toBeInstanceOf(Object);
  });

  it('Should connect to mongoose', async () => {
    const connection = await database.connectMongoose();
    expect(connection).toBeInstanceOf(Function);
  });
});
