import { Injectable } from '@rxdi/core';
import { MigrationSchema } from '../../injection.tokens';
import { readdir } from 'fs';
import { extname, join, isAbsolute } from 'path';
import { promisify } from 'util';
import { ConfigService } from '../config/config.service';

@Injectable()
export class MigrationsResolver {
  constructor(private configService: ConfigService) {}

  async getFileNames() {
    return (await promisify(readdir)(
      this.configService.config.migrationsDir
    )).filter(file => extname(file) === '.js');
  }

  loadMigration(fileName: string): MigrationSchema {
    return require(join(
      process.cwd(),
      this.configService.config.migrationsDir,
      fileName
    ));
  }

  async resolve() {
    if (isAbsolute(this.configService.config.migrationsDir)) {
      return this.configService.config.migrationsDir;
    }
    return join(process.cwd(), this.configService.config.migrationsDir);
  }
}
