import { Module, ModuleWithProviders } from '@rxdi/core';
import { GenericRunner } from './services/generic-runner/generic-runner.service';
import { LogFactory } from './helpers/log-factory';
import {
  Config,
  LoggerConfig,
  CommandInjector,
  Tasks
} from './injection.tokens';
import { MigrationService } from './services/migration/migration.service';
import { nextOrDefault, includes } from './helpers/args-extractors';
import { DEFAULT_CONFIG } from './default.config';
import { ConfigService } from './services/config/config.service';
import { ensureDir } from './helpers';
import { promisify } from 'util';
import { exists, unlink, stat, readFile, writeFile, Stats } from 'fs';
import { TranspileTypescript } from './helpers/typescript-builder';
import { join } from 'path';
import { MigrationsResolver } from './services/migrations-resolver/migrations-resolver.service';

@Module()
export class MigrationsModule {
  public static forRoot(config: Config = DEFAULT_CONFIG): ModuleWithProviders {
    return {
      module: MigrationsModule,
      providers: [
        GenericRunner,
        LogFactory,
        ConfigService,
        MigrationsResolver,
        {
          provide: Config,
          useValue: config
        },
        {
          provide: LoggerConfig,
          useValue: config.logger
        },
        {
          provide: 'set-tasks',
          deps: [GenericRunner, MigrationService],
          useFactory: async (
            runner: GenericRunner,
            migrationService: MigrationService
          ) => {
            const tasks = [
              ['up', migrationService.up],
              ['down', migrationService.down],
              ['status', migrationService.status],
              ['create', migrationService.create],
              ['init', migrationService.init]
            ];
            runner.setTasks(tasks);
            runner.bind(migrationService);
            return tasks;
          }
        },
        {
          provide: CommandInjector,
          useFactory: () => {
            const [, , ...args] = process.argv;
            return {
              command: args[0],
              argv: args
            };
          }
        },
        {
          provide: 'start',
          deps: [CommandInjector, GenericRunner, ConfigService],
          useFactory: async (
            { command, argv }: { command: Tasks; argv: any[] },
            runner: GenericRunner,
            configService: ConfigService
          ) => {
            try {
              let settings: any;
              const configFilename = 'xmigrate';
              if (await promisify(exists)(`./${configFilename}.ts`)) {
                const isMigrateTempConfigExists = await promisify(exists)(
                  './.xmigrate/config.temp'
                );
                const TranspileAndWriteTemp = async (stats: Stats) => {
                  await TranspileTypescript(
                    [`/${configFilename}.ts`],
                    config.outDir
                  );
                  console.log('Transpile complete!');
                  await promisify(writeFile)(
                    './.xmigrate/config.temp',
                    stats.mtime.toISOString(),
                    { encoding: 'utf-8' }
                  );
                };
                const stats = await promisify(stat)(`./${configFilename}.ts`);
                if (isMigrateTempConfigExists) {
                  const temp = await promisify(readFile)(
                    './.xmigrate/config.temp',
                    { encoding: 'utf-8' }
                  );
                  if (
                    new Date(temp).toISOString() !== stats.mtime.toISOString()
                  ) {
                    console.log('Xmigrate configuration is new transpiling...');
                    await TranspileAndWriteTemp(stats);
                  }
                } else {
                  console.log('Transpile xmigrate.ts...');
                  await TranspileAndWriteTemp(stats);
                }
                settings = require(join(
                  process.cwd(),
                  `./${config.outDir}`,
                  `${configFilename}.js`
                ));
                try {
                  await promisify(unlink)(
                    join('./', config.outDir, 'xmigrate.js.map')
                  );
                } catch (e) {}
              } else {
                settings = require('esm')(module)(`./${configFilename}.js`);
              }
              if (settings.default) {
                settings = await (settings as {
                  default: () => Promise<Config>;
                }).default();
              } else {
                settings = (await (settings as Function)()) as Config;
              }
              configService.set(settings as Config);
            } catch (e) {}
            await ensureDir(configService.config.logger.folder);
            await ensureDir(configService.config.migrationsDir);
            let hasCrashed: boolean;
            if (command === 'create') {
              hasCrashed = await runner.run(command, {
                name: argv[1],
                template: nextOrDefault('--template', null)
              });
            } else if (command === 'up') {
              hasCrashed = await runner.run(command, {
                rollback: includes('--rollback')
              });
            } else {
              hasCrashed = await runner.run(command);
            }

            if (hasCrashed) {
              return process.exit(1);
            }
            process.exit(0);
          }
        }
      ]
    };
  }
}
