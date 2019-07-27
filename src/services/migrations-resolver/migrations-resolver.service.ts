import { Injectable } from '@rxdi/core';
import { MigrationSchema } from '../../injection.tokens';
import { readdir, unlink } from 'fs';
import { extname, join, isAbsolute } from 'path';
import { promisify } from 'util';
import { ConfigService } from '../config/config.service';
import { TranspileTypescript } from '../../helpers/typescript-builder';
@Injectable()
export class MigrationsResolver {
  defaultCompilationPath = `${process.cwd()}/dist/`;
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
    let migration: MigrationSchema;
    if (this.isTypescript(fileName)) {
      migration = await this.loadTsMigration(fileName);
    } else {
      migration = require('esm')(module)(this.getFilePath(fileName));
    }
    return migration;
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

  async clean(migrations: string[]) {
    await Promise.all(
      migrations.map(fileName => this.deleteArtefacts(fileName))
    );
    return true;
  }

  async deleteArtefacts(fileName: string) {
    await this.delete(fileName);
    await this.delete(`${fileName}.map`);
  }

  async delete(fileName: string) {
    return new Promise((resolve, rejects) => {
      unlink(this.getTsFilePath(fileName), err => {
        if (err) {
          rejects(err);
        }
        resolve(true);
      });
    });
  }

  async loadTsMigration(fileName: string) {
    return require(this.getTsFilePath(fileName));
  }

  async transpileMigrations(migrations: string[]) {
    await TranspileTypescript(
      migrations.map(fileName => this.getRelativePath(fileName))
    );
  }

  getTsFilePath(fileName: string) {
    return `${this.defaultCompilationPath}${this.replaceFilenameJsWithTs(
      fileName
    )}`;
  }

  replaceFilenameJsWithTs(fileName: string) {
    return fileName.replace('ts', 'js');
  }
  async resolve() {
    if (isAbsolute(this.configService.config.migrationsDir)) {
      return this.configService.config.migrationsDir;
    }
    return join(process.cwd(), this.configService.config.migrationsDir);
  }
}
