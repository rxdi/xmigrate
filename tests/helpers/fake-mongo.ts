function FakeDatabase(response: unknown, databaseName: string) {
  return {
    collection: () => ({
      insertOne: () => [''],
      find: () => ({ toArray: () => [''] }),
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

export function FakeMongoClient(response: unknown,  databaseName: string) {
  return {
    connect: () => {},
    db: () => ({
      collection: () => ({
        insertOne: () => [''],
        find: () => ({ toArray: () => [''] }),
        updateOne: () => ({ response }),
        deleteOne: () => ({ response })
      })
    })
  };
}
