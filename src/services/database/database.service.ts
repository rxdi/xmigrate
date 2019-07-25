import { Injectable } from '@rxdi/core';
import { MongoClient } from 'mongodb';
import { connect, ConnectionOptions } from 'mongoose';
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

    return (await MongoClient.connect(
      url,
      this.configService.config.mongodb.options
    )).db(databaseName);
  }

  mongooseConnect(options?: ConnectionOptions) {
    return connect(
      `${this.configService.config.mongodb.url}/${
        this.configService.config.mongodb.databaseName
      }`,
      options
    );
  }
}
