import { ReturnType, Tasks, MigrationSchema } from '../../injection.tokens';
import { normalize } from 'path';
import chalk from 'chalk';
import { LogFactory } from '../../helpers/log-factory';
import { Injectable } from '@rxdi/core';
import { MigrationService } from '../migration/migration.service';
import { ConfigService } from '../config/config.service';
import { MigrationsResolver } from '../migrations-resolver/migrations-resolver.service';

@Injectable()
export class GenericRunner {
  private tasks: Map<string, Function> = new Map();
  constructor(
    private logger: LogFactory,
    private configService: ConfigService,
    private resolver: MigrationsResolver,
    private migrationService: MigrationService
  ) {}

  setTasks(tasks: any[]) {
    this.tasks = new Map(tasks);
  }

  async run(name: Tasks, args?: any) {
    await this.logEnvironment(name);
    if (!this.tasks.has(name)) {
      throw new Error('\n🔥  Missing command');
    }
    try {
      const res = await this.tasks.get(name)(args);
      if (res && res.status && res.result.length) {
        console.log(`
          \n🔥  There are ${chalk.red(
            res.result.length
          )} migration with status '${chalk.red('PENDING')}' run '${chalk.green(
          `xmigrate up`
        )}' command!
          `);
      } else {
        console.log(`
        \n🚀  ${chalk.green.bold(
          res && res.length
            ? `Success! Runned ${res.length} migrations.`
            : 'Already up to date'
        )}
        `);
      }

      setTimeout(() => process.exit(0), 0);
    } catch (e) {
      console.error(`
      \n🔥  ${chalk.bold('Status: Operation executed with error')}
🧨  ${chalk.bold('Error: ' + JSON.stringify(e))}
📨  ${chalk.bold('Message: ' + e.message)}
      `);
      if (args && args.rollback) {
        try {
          await this.rollback(e.fileName);
        } catch (err) {
          console.log('\n🔥  Migration rollback exited with error  ', err);
          this.logger.getDownLogger().error({
            errorMessage: err.message,
            fileName: e.fileName
          });
        }
      }
      setTimeout(() => process.exit(1), 0);
    }
  }

  private async rollback(fileName: string) {
    const response: ReturnType = {
      fileName,
      appliedAt: new Date()
    } as any;
    const logger = this.logger.getDownLogger();
    const { migrationsDir } = this.configService.config;
    const migrationPath = normalize(
      `${process.cwd()}/${migrationsDir}/${fileName}`
    );

    console.log(`
\n🙏  ${chalk.bold('Status: Executing rallback operation')} ${chalk.red(
      'xmigrate down'
    )}
📁  ${chalk.bold('Migration:')} ${migrationPath}
      `);

    let migration: MigrationSchema;
    if (this.resolver.isTypescript(fileName)) {
      migration = await this.resolver.loadTsMigration(fileName);
    } else {
      migration = require(migrationPath);
    }
    response.result = await migration.down(await this.migrationService.connect());
    response.appliedAt = new Date();
    console.log(
      `\n🚀  ${chalk.green(
        'Rallback operation success, nothing changed if written correctly!'
      )}`
    );
    logger.log(response);
    return response;
  }

  bind(self: MigrationService) {
    // Binds appropriate `this` to tasks
    Array.from(this.tasks.keys()).map(k =>
      this.tasks.set(k, this.tasks.get(k).bind(self))
    );
    return this;
  }

  private async logEnvironment(taskName: string) {
    const {
      mongodb: { databaseName },
      migrationsDir,
      logger: { folder },
      changelogCollectionName
    } = this.configService.config;
    console.log(`
    \n🖥️  ${chalk.bold('Database:')} ${chalk.blue.bold(databaseName)}
    \n💿  ${chalk.bold('DBCollection:')} ${chalk.blue.bold(
      changelogCollectionName
    )}
    \n🗄️  ${chalk.bold('LoggerDir:')} ${chalk.blue.bold(folder)}
    \n📁  ${chalk.bold('MigrationsDir:')} ${chalk.blue.bold(migrationsDir)}
    \n👷  ${chalk.bold('Script:')} ${chalk.blue.bold(`xmigrate ${taskName}`)}
    `);
  }
}
