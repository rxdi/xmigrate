import { Injectable } from '@rxdi/core';
import { readdir, unlink } from 'fs';
import { extname, join } from 'path';
import { promisify } from 'util';

import { TranspileTypescript } from '../../helpers/typescript-builder';
import { MigrationSchema } from '../../injection.tokens';
import { ConfigService } from '../config/config.service';

@Injectable()
export class MigrationsResolver {
  constructor(private configService: ConfigService) {}

  async getFileNames() {
    return (
      await promisify(readdir)(this.configService.config.migrationsDir)
    ).filter((file) => extname(file) === '.js' || this.isTypescript(file));
  }

  readDir() {
    return promisify(readdir)(this.configService.config.outDir);
  }

  async getDistFileNames() {
    return (await this.readDir())
      .filter((file) => extname(file) === '.js')
      .map((f) => this.getTsCompiledFilePath(f));
  }

  isTypescript(file: string) {
    return extname(file) === '.ts' && this.configService.config.typescript;
  }

  async loadMigration(fileName: string): Promise<MigrationSchema> {
    let migration: MigrationSchema;
    if (this.isTypescript(fileName)) {
      migration = await this.loadTsCompiledMigration(fileName);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      migration = require('esm')(module)(this.getFilePath(fileName));
    }
    return migration;
  }

  getFilePath(fileName: string) {
    return join(
      process.cwd(),
      this.configService.config.migrationsDir,
      fileName,
    );
  }

  getRelativePath(fileName: string) {
    return this.getFilePath(fileName).replace(process.cwd(), '');
  }

  async clean(migrations: string[]) {
    await Promise.all(
      migrations.map((fileName) => this.deleteArtefacts(fileName)),
    );
    return true;
  }

  async deleteArtefacts(fileName: string) {
    await this.delete(this.getTsCompiledFilePath(fileName));
    await this.delete(this.getTsCompiledFilePath(`${fileName}.map`));
  }

  async delete(path: string) {
    return new Promise((resolve) => unlink(path, () => resolve(true)));
  }

  async loadTsCompiledMigration(fileName: string) {
    return require(this.getTsCompiledFilePath(fileName));
  }

  async transpileMigrations(migrations: string[]) {
    await TranspileTypescript(
      migrations.map((fileName) => this.getRelativePath(fileName)),
      this.configService.config.outDir,
    );
  }

  getTsCompiledFilePath(fileName: string) {
    return join(
      process.cwd(),
      this.configService.config.outDir,
      this.replaceFilenameJsWithTs(fileName),
    );
  }

  replaceFilenameJsWithTs(fileName: string) {
    return fileName.replace('ts', 'js');
  }
}
