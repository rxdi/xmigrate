import { DatabaseService } from '../database/database.service';
import { Injectable } from '@rxdi/core';
import { ensureDir } from '../../helpers/ensure-folder';
import { ReturnType } from '../../injection.tokens';
import { promisify } from 'util';
import { writeFile } from 'fs';
import { nowAsString } from '../../helpers/date';
import { TemplateTypes } from '../../templates/index';
import * as templates from '../../templates/index';
import { MigrationsResolver } from '../migrations-resolver/migrations-resolver.service';
import chalk from 'chalk';
import { normalize } from 'path';
import { LogFactory } from '../../helpers/log-factory';
import { ErrorMap } from '../../helpers/error';
import { ConfigService } from '../config/config.service';

@Injectable()
export class MigrationService {
  constructor(
    private configService: ConfigService,
    private database: DatabaseService,
    private migrationsResolver: MigrationsResolver,
    private logger: LogFactory
  ) {}

  async connect() {
    await this.ensureFolders();
    await this.database.mongooseConnect();
    return this.database.connect();
  }

  async ensureFolders() {
    await ensureDir(this.configService.config.logger.folder);
    await ensureDir(this.configService.config.migrationsDir);
  }

  async up() {
    const statusItems = await this.statusInternal();
    const pendingItems = statusItems.filter(
      item => item.appliedAt === 'PENDING'
    );
    const migrated = [];

    const db = await this.connect();

    const logger = this.logger.getUpLogger();

    const migrateItem = async (item: ReturnType) => {
      let result: unknown;
      try {
        const migration = await this.migrationsResolver.loadMigration(
          item.fileName
        );
        result = await migration.up(db);
      } catch (err) {
        const error = new ErrorMap(err.message);
        error.fileName = item.fileName;
        error.migrated = migrated;
        logger.error({
          migrated,
          errorMessage: error.message,
          fileName: item.fileName
        });
        throw error;
      }
      const collection = db.collection(
        this.configService.config.changelogCollectionName
      );
      const { fileName } = item;
      const appliedAt = new Date();

      try {
        await collection.insertOne({ fileName, appliedAt });
      } catch (err) {
        logger.error({
          migrated,
          errorMessage: err.message,
          fileName: item.fileName
        });
        throw new Error(`Could not update changelog: ${err.message}`);
      }
      const res = {
        fileName: item.fileName,
        appliedAt,
        result
      };
      logger.log(res);
      migrated.push(res);
      return await true;
    };
    for (const item of pendingItems) {
      await migrateItem(item);
    }
    this.printStatus(migrated);
    return migrated;
  }

  async down() {
    const downgraded = [];
    const statusItems = await this.statusInternal();
    const appliedItems = statusItems.filter(
      item => item.appliedAt !== 'PENDING'
    );
    const lastAppliedItem = appliedItems[appliedItems.length - 1];
    let result: unknown;

    const logger = this.logger.getDownLogger();
    const db = await this.connect();
    if (lastAppliedItem) {
      try {
        const migration = await this.migrationsResolver.loadMigration(
          lastAppliedItem.fileName
        );
        result = await migration.down(db);
      } catch (err) {
        const error = new ErrorMap(err.message);
        error.fileName = lastAppliedItem.fileName;
        error.downgraded = downgraded;
        logger.error({
          downgraded,
          errorMessage: err.message,
          fileName: lastAppliedItem.fileName
        });
        throw error;
      }
      const collection = db.collection(
        this.configService.config.changelogCollectionName
      );
      try {
        await collection.deleteOne({ fileName: lastAppliedItem.fileName });
        const res: ReturnType = {
          fileName: lastAppliedItem.fileName,
          appliedAt: new Date(),
          result
        };
        logger.log(res);
        downgraded.push(res);
      } catch (err) {
        logger.error({
          downgraded,
          errorMessage: err.message,
          fileName: lastAppliedItem.fileName
        });
        throw new Error(`Could not update changelog: ${err.message}`);
      }
    }
    this.printStatus(downgraded);
    return result;
  }

  async createWithTemplate(template: TemplateTypes, name: string) {
    if (!templates[template]) {
      throw new Error(`🔥  *** Missing template ${template} ***`);
    }
    const isTypescript = template === 'typescript';

    const fileName = normalize(
      `./${this.configService.config.migrationsDir}/${nowAsString()}-${name}.${
        isTypescript ? 'ts' : 'js'
      }`
    );
    await promisify(writeFile)(fileName, templates[template], {
      encoding: 'utf-8'
    });
    return fileName;
  }

  async init() {
    await promisify(writeFile)('./xmigrate.js', templates.migration, {
      encoding: 'utf-8'
    });
  }

  async create({ name, template }) {
    await this.ensureFolders();
    const customTemplate =
      template || this.configService.config.defaultTemplate;
    const fileName = await this.createWithTemplate(customTemplate, name);
    console.log(`
\n🚀  ${chalk.bold('Template:')} "${chalk.blue(customTemplate)}"!
\n💾  ${chalk.bold('File:')} ${chalk.blue(
      normalize(`${process.cwd()}//${fileName}`)
    )}
\n🚀  ${chalk.green.bold('Migration template created!')}
`);
    process.exit(0);
  }

  private async statusInternal() {
    const fileNames = await this.migrationsResolver.getFileNames();
    const db = await this.connect();
    const collection = db.collection<ReturnType>(
      this.configService.config.changelogCollectionName
    );
    const changelog = await collection.find({}).toArray();
    return fileNames.map((fileName: string) => {
      const itemInLog = changelog.find(log => log.fileName === fileName);
      const appliedAt = itemInLog
        ? (itemInLog.appliedAt as any).toJSON()
        : 'PENDING';
      return { fileName, appliedAt, result: null } as ReturnType;
    });
  }

  async status() {
    const statusTable = await this.statusInternal();
    this.printStatus(statusTable, 'table');
    return {
      status: true,
      result: statusTable.filter(i => i.appliedAt === 'PENDING')
    };
  }

  printStatus(status: ReturnType[], type?: 'table') {
    if (type === 'table') {
      return console.table(status, ['fileName', 'appliedAt']);
    }
    status.forEach((item, index) =>
      console.log(`
#️⃣  ${chalk.white.bold(String(index + 1))}
${chalk.blue('-'.repeat(process.stdout.columns))}
📁  ${chalk.bold(`Filename:`)} ${chalk.green(item.fileName)}
⏱️  ${chalk.bold(`Applied at:`)} ${chalk.green(String(item.appliedAt))}
${chalk.blue('-'.repeat(process.stdout.columns))}
    `)
    );
  }
}
