import { Injectable } from '@rxdi/core';
import { MongoClient } from 'mongodb';
import { connect, Mongoose } from 'mongoose';

import { ConfigService } from '../config/config.service';

@Injectable()
export class DatabaseService {
  connections: Map<string, MongoClient> = new Map();
  connectionsMongoose: Map<string, Mongoose> = new Map();

  constructor(private configService: ConfigService) {}
  async connect() {
    const url = this.configService.config.mongodb.url;
    const databaseName = this.configService.config.mongodb.databaseName;
    if (!url) {
      throw new Error('No `url` defined in config file!');
    }

    if (!databaseName) {
      throw new Error(
        'No `databaseName` defined in config file! This is required since migrate-mongo v3. ' +
          'See https://github.com/seppevs/migrate-mongo#initialize-a-new-project',
      );
    }
    const client = await this.getMongoClient().connect(
      url,
      this.configService.config.mongodb.options,
    );
    const originalDb = client.db.bind(client);
    client.db = (dbName?: string) => originalDb(dbName || databaseName);
    this.setConnections(url, client);
    return client;
  }

  getMongoClient() {
    return MongoClient;
  }

  async close() {
    await Promise.all([...this.connections.values()].map((c) => c.close(true)));
  }

  async closeMongoose() {
    await Promise.all(
      [...this.connectionsMongoose.values()].map((c) => c.disconnect()),
    );
  }

  setConnections(url: string, client: MongoClient) {
    this.connections.set(url, client);
  }

  setConnectionsMongoose(url: string, client: Mongoose) {
    this.connectionsMongoose.set(url, client);
  }

  connectMongoose() {
    return connect;
  }

  async mongooseConnect() {
    const url = `${this.configService.config.mongodb.url}/${this.configService.config.mongodb.databaseName}`;
    const connection = await this.connectMongoose()(
      url,
      this.configService.config.mongodb.options,
    );
    this.setConnectionsMongoose(url, connection);
    return connection;
  }
}
