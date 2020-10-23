import { Injectable } from '@rxdi/core';
import chalk from 'chalk';
import { createWriteStream, readFile, writeFile } from 'fs';
import { normalize } from 'path';
import { promisify } from 'util';

import { nowAsString } from '../../helpers/date';
import { ErrorMap } from '../../helpers/error';
import { LogFactory } from '../../helpers/log-factory';
import { ReturnType } from '../../injection.tokens';
import { TemplateTypes } from '../../templates/index';
import * as templates from '../../templates/index';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { MigrationsResolver } from '../migrations-resolver/migrations-resolver.service';

@Injectable()
export class MigrationService {
  constructor(
    private configService: ConfigService,
    private database: DatabaseService,
    private migrationsResolver: MigrationsResolver,
    private logger: LogFactory,
  ) {}

  async connect() {
    await this.database.mongooseConnect();
    return this.database.connect();
  }

  async up() {
    const statusItems = await this.statusInternal();
    const pendingItems = statusItems.filter(
      (item) => item.appliedAt === 'PENDING',
    );
    const migrated: ReturnType[] = [];

    const client = await this.connect();

    const logger = this.logger.getUpLogger();
    const typescriptMigrations = pendingItems
      .filter((item) => this.migrationsResolver.isTypescript(item.fileName))
      .map((m) => m.fileName);
    if (typescriptMigrations.length) {
      await this.migrationsResolver.transpileMigrations(typescriptMigrations);
    }
    const migrateItem = async (item: ReturnType) => {
      let result: unknown;
      try {
        const migration = await this.migrationsResolver.loadMigration(
          item.fileName,
        );
        result = await migration.up(client);
      } catch (err) {
        const error = new ErrorMap(err.message);
        error.fileName = item.fileName;
        error.migrated = migrated;
        await logger.error({
          migrated,
          errorMessage: error.message,
          fileName: item.fileName,
        });
        throw error;
      }
      const collection = client
        .db()
        .collection(this.configService.config.changelogCollectionName);
      const { fileName } = item;
      const appliedAt = new Date();

      try {
        await collection.insertOne({ fileName, appliedAt });
      } catch (err) {
        await logger.error({
          migrated,
          errorMessage: err.message,
          fileName: item.fileName,
        });
        throw new Error(`Could not update changelog: ${err.message}`);
      }
      const res = {
        fileName: item.fileName,
        appliedAt,
        result,
      };
      await logger.log(res);
      migrated.push(res);
      return await true;
    };
    for (const item of pendingItems) {
      await migrateItem(item);
    }
    await this.migrationsResolver.clean(typescriptMigrations);
    this.printStatus(migrated);
    return migrated;
  }

  async down() {
    const downgraded: ReturnType[] = [];
    const statusItems = await this.statusInternal();

    const appliedItems = statusItems.filter(
      (item) => item.appliedAt !== 'PENDING',
    );
    const lastAppliedItem = appliedItems[appliedItems.length - 1];
    if (!lastAppliedItem) {
      return;
    }
    const isTypescript = this.migrationsResolver.isTypescript(
      lastAppliedItem.fileName,
    );
    let result: unknown;
    if (appliedItems.length && lastAppliedItem) {
      const logger = this.logger.getDownLogger();
      const client = await this.connect();

      if (isTypescript) {
        await this.migrationsResolver.transpileMigrations([
          lastAppliedItem.fileName,
        ]);
      }
      try {
        const migration = await this.migrationsResolver.loadMigration(
          lastAppliedItem.fileName,
        );
        result = await migration.down(client);
      } catch (err) {
        const error = new ErrorMap(err.message);
        error.fileName = lastAppliedItem.fileName;
        error.downgraded = downgraded;
        await logger.error({
          downgraded,
          errorMessage: err.message,
          fileName: lastAppliedItem.fileName,
        });
        throw error;
      }
      const collection = client
        .db()
        .collection(this.configService.config.changelogCollectionName);
      try {
        await collection.deleteOne({ fileName: lastAppliedItem.fileName });
        const res: ReturnType = {
          fileName: lastAppliedItem.fileName,
          appliedAt: new Date(),
          result,
        };
        await logger.log(res);
        downgraded.push(res);
      } catch (err) {
        await logger.error({
          downgraded,
          errorMessage: err.message,
          fileName: lastAppliedItem.fileName,
        });
        throw new Error(`Could not update changelog: ${err.message}`);
      }
    }
    if (lastAppliedItem) {
      await this.migrationsResolver.clean([lastAppliedItem.fileName]);
    }
    this.printStatus(downgraded);
    return downgraded;
  }

  async createWithTemplate(
    template: TemplateTypes,
    name: string,
    config: { raw: boolean; typescript?: boolean } = {
      raw: false,
      typescript: false,
    },
  ) {
    let rawTemplate = templates[template];

    if (config.raw) {
      rawTemplate = template;
    } else if (!rawTemplate) {
      throw new Error(`🔥  *** Missing template ${template} ***`);
    }

    const isTypescript = config.typescript || template === 'typescript';
    const dateTimeFormat = this.configService.config.dateTimeFormat;
    const timestamp = dateTimeFormat ? dateTimeFormat() : nowAsString();
    const filePath = normalize(
      `./${this.configService.config.migrationsDir}/${timestamp}-${name}.${
        isTypescript ? 'ts' : 'js'
      }`,
    );
    await promisify(writeFile)(filePath, rawTemplate, {
      encoding: 'utf-8',
    });
    return '/' + filePath;
  }

  private async writeConfig() {
    await promisify(writeFile)('./xmigrate.js', templates.migration, {
      encoding: 'utf-8',
    });
  }

  async init() {
    const gitIgnore = await promisify(readFile)('./.gitignore', {
      encoding: 'utf-8',
    });
    const stream = createWriteStream('./.gitignore', { flags: 'a' });
    if (!gitIgnore.includes('.cache')) {
      stream.write('\n.cache');
    }
    if (!gitIgnore.includes('.xmigrate')) {
      stream.write('\n.xmigrate');
    }
    stream.end();
    await this.writeConfig();
  }

  async create({ name, template }: { name: string; template: TemplateTypes }) {
    const customTemplate =
      template || this.configService.config.defaultTemplate;

    const fileName = await this.createWithTemplate(customTemplate, name);
    console.log(`
\n🚀  ${chalk.bold('Template:')} "${chalk.blue(customTemplate)}"!
\n💾  ${chalk.bold('File:')} ${chalk.blue(
      normalize(`${process.cwd()}//${fileName}`),
    )}
\n🚀  ${chalk.green.bold('Migration template created!')}
`);
  }

  async statusInternal() {
    const fileNames = await this.migrationsResolver.getFileNames();
    const client = await this.connect();
    const collection = client
      .db()
      .collection<ReturnType>(
        this.configService.config.changelogCollectionName,
      );
    const changelog = await collection.find({}).toArray();
    return fileNames.map((fileName: string) => {
      const itemInLog = changelog.find((log) => log.fileName === fileName);
      const appliedAt = itemInLog
        ? (itemInLog.appliedAt as Date).toJSON()
        : 'PENDING';
      return { fileName, appliedAt, result: null } as ReturnType;
    });
  }

  async status() {
    const statusTable = await this.statusInternal();
    this.printStatus(statusTable, 'table');
    return {
      status: true,
      result: statusTable.filter((i) => i.appliedAt === 'PENDING'),
    };
  }

  printStatus(status: ReturnType[], type?: 'table') {
    if (type === 'table' && status.length) {
      return console.table(status, ['fileName', 'appliedAt']);
    }
    status.forEach((item, index) =>
      console.log(`
#️⃣  ${chalk.white.bold(String(index + 1))}
${chalk.blue('-'.repeat(process.stdout.columns))}
📁  ${chalk.bold(`Filename:`)} ${chalk.green(item.fileName)}
⏱️  ${chalk.bold(`Applied at:`)} ${chalk.green(String(item.appliedAt))}
${chalk.blue('-'.repeat(process.stdout.columns))}
    `),
    );
  }
}
