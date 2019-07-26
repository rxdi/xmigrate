import { Injectable } from '@rxdi/core';
import { MongoClient } from 'mongodb';
import { connect } from 'mongoose';
import { ConfigService } from '../config/config.service';

@Injectable()
export class DatabaseService {
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
          'See https://github.com/seppevs/migrate-mongo#initialize-a-new-project'
      );
    }
    const client = await MongoClient.connect(
      url,
      this.configService.config.mongodb.options
    );
    const originalDb = client.db.bind(client);
    client.db = (dbName: string) => originalDb(dbName || databaseName);
    return client;
  }

  mongooseConnect() {
    return connect(
      `${this.configService.config.mongodb.url}/${
        this.configService.config.mongodb.databaseName
      }`,
      this.configService.config.mongodb.options
    );
  }
}
