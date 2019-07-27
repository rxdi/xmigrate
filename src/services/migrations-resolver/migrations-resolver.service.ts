import { Injectable } from '@rxdi/core';
import { MigrationSchema } from '../../injection.tokens';
import { readdir, unlink } from 'fs';
import { extname, join, isAbsolute } from 'path';
import { promisify } from 'util';
import { ConfigService } from '../config/config.service';
import { TranspileTypescript } from '../../helpers/typescript-builder';

@Injectable()
export class MigrationsResolver {
  constructor(private configService: ConfigService) {}

  async getFileNames() {
    return (await promisify(readdir)(
      this.configService.config.migrationsDir
    )).filter(file => extname(file) === '.js' || this.isTypescript(file));
  }

  async getDistFileNames() {
    return (await promisify(readdir)(
      this.configService.config.outDir
    ))
      .filter(file => extname(file) === '.js')
      .map(f => this.getTsCompiledFilePath(f));
  }

  isTypescript(file: string) {
    return extname(file) === '.ts' && this.configService.config.typescript;
  }

  async loadMigration(
    fileName: string,
    cwd?: string
  ): Promise<MigrationSchema> {
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

  async clean(migrations: string[] = []) {
    if (!migrations.length) {
      migrations = await this.getFileNames();
    }
    await Promise.all(
      migrations.map(fileName => this.deleteArtefacts(fileName))
    );
    return true;
  }

  async deleteArtefacts(fileName: string) {
    await this.delete(this.getTsCompiledFilePath(fileName));
    await this.delete(this.getTsCompiledFilePath(`${fileName}.map`));
  }

  async delete(path: string) {
    return new Promise(resolve => unlink(path, () => resolve(true)));
  }

  async loadTsMigration(fileName: string) {
    return require(this.getTsCompiledFilePath(fileName));
  }

  async transpileMigrations(migrations: string[]) {
    await TranspileTypescript(
      migrations.map(fileName => this.getRelativePath(fileName)),
      this.configService.config.outDir
    );
  }

  getTsCompiledFilePath(fileName: string) {
    return join(process.cwd(), this.configService.config.outDir, this.replaceFilenameJsWithTs(
      fileName
    ));
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
