import { ReturnType } from '../../src/injection.tokens';

function FakeDatabase(response: unknown, databaseName: string) {
  return {
    collection: () => ({
      insertOne: () => [''],
      find: () => ({
        toArray: () => [
          {
            fileName: '20190728192825-pesho1234.js',
            appliedAt: new Date(),
            result: {}
          }
        ]
      }),
      updateOne: () => ({ response }),
      deleteOne: () => ({ response })
    })
  };
}

export class MongoClientMockUp {
  constructor(private response: unknown, private databaseName: string) {}
  connect() {
    return new MongoClientMockUp(this.response, this.databaseName);
  }

  db() {
    return FakeDatabase(this.response, this.databaseName);
  }
}

export function TestCollectionMongo(response: unknown, data: ReturnType[] = []) {
  return {
    insertOne: () => data,
    find: () => ({
      toArray: () => data
    }),
    updateOne: () => ({ response }),
    deleteOne: () => ({ response })
  };
}

export function FakeMongoClient(response: unknown, data: ReturnType[] = []) {
  return {
    connect: () => {},
    db: () => ({
      collection: () => TestCollectionMongo(response, [...data])
    })
  };
}
