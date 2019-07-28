import { createTestBed, Container } from '@rxdi/core';
import { DatabaseService } from './database.service';
import { ConfigService } from '../config/config.service';
import { MongoClientMockUp } from '../../../tests/helpers';

describe('Database service', () => {
  let database: DatabaseService;
  let config: ConfigService;

  beforeEach(async () => {
    await createTestBed({
      providers: [DatabaseService, ConfigService]
    });
    database = Container.get(DatabaseService);
    config = Container.get(ConfigService);
    config.set({
      outDir: '',
      mongodb: {
        url: 'test',
        databaseName: 'test',
        options: {
          useNewUrlParser: true
        }
      }
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
          'See https://github.com/seppevs/migrate-mongo#initialize-a-new-project'
      );
    }
  });

  it('Should connect to database and return mongo client', async () => {
    const spy = spyOn(database, 'getMongoClient').and.callFake(
      () => new MongoClientMockUp(true, 'pesho')
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
      () => new MongoClientMockUp(true, 'pesho')
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
    class MongooseConnect {}
    const spy = spyOn(database, 'mongooseConnect').and.callFake(
      () => new MongooseConnect()
    );
    const connection = await database.mongooseConnect();
    expect(connection).toBeInstanceOf(MongooseConnect);
    expect(spy).toHaveBeenCalled();
  });

});
