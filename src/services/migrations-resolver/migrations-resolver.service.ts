import { Injectable } from '@rxdi/core';
import { MigrationSchema } from '../../injection.tokens';
import { readdir } from 'fs';
import { extname, join, isAbsolute } from 'path';
import { promisify } from 'util';
import { ConfigService } from '../config/config.service';
import { exec } from 'child_process';

@Injectable()
export class MigrationsResolver {
  constructor(private configService: ConfigService) {}

  async getFileNames() {
    return (await promisify(readdir)(
      this.configService.config.migrationsDir
    )).filter(file => extname(file) === '.js' || this.isTypescript(file));
  }

  isTypescript(file: string) {
    return extname(file) === '.ts' && this.configService.config.typescript;
  }

  async loadMigration(fileName: string): Promise<MigrationSchema> {
    if (this.isTypescript(fileName)) {
      return this.loadTsMigration(fileName);
    }
    return require('esm')(module)(this.getFilePath(fileName));
  }

  getFilePath(fileName: string) {
    return join(
      process.cwd(),
      this.configService.config.migrationsDir,
      fileName
    );
  }

  getRelativePath(fileName: string) {
    return this.getFilePath(fileName).replace(process.cwd(), '');
  }

  async loadTsMigration(fileName: string) {
    const tsPath = this.getRelativePath(fileName);
    await promisify(exec)(`npx gapi build --local --path=./${tsPath}`, {
      cwd: process.cwd()
    });
    const compiledJsPath = `${process.cwd()}/dist/${fileName.replace(
      'ts',
      'js'
    )}`;
    return require(compiledJsPath);
  }
  async resolve() {
    if (isAbsolute(this.configService.config.migrationsDir)) {
      return this.configService.config.migrationsDir;
    }
    return join(process.cwd(), this.configService.config.migrationsDir);
  }
}
