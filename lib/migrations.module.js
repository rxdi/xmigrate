"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var MigrationsModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
const generic_runner_service_1 = require("./services/generic-runner/generic-runner.service");
const log_factory_1 = require("./helpers/log-factory");
const injection_tokens_1 = require("./injection.tokens");
const migration_service_1 = require("./services/migration/migration.service");
const args_extractors_1 = require("./helpers/args-extractors");
const default_config_1 = require("./default.config");
const config_service_1 = require("./services/config/config.service");
const helpers_1 = require("./helpers");
const util_1 = require("util");
const fs_1 = require("fs");
const typescript_builder_1 = require("./helpers/typescript-builder");
const path_1 = require("path");
const migrations_resolver_service_1 = require("./services/migrations-resolver/migrations-resolver.service");
let MigrationsModule = MigrationsModule_1 = class MigrationsModule {
    static forRoot(config = default_config_1.DEFAULT_CONFIG) {
        return {
            module: MigrationsModule_1,
            providers: [
                generic_runner_service_1.GenericRunner,
                log_factory_1.LogFactory,
                config_service_1.ConfigService,
                migrations_resolver_service_1.MigrationsResolver,
                {
                    provide: injection_tokens_1.Config,
                    useValue: config
                },
                {
                    provide: injection_tokens_1.LoggerConfig,
                    useValue: config.logger
                },
                {
                    provide: 'set-tasks',
                    deps: [generic_runner_service_1.GenericRunner, migration_service_1.MigrationService],
                    useFactory: (runner, migrationService) => __awaiter(this, void 0, void 0, function* () {
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
                    })
                },
                {
                    provide: injection_tokens_1.CommandInjector,
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
                    deps: [injection_tokens_1.CommandInjector, generic_runner_service_1.GenericRunner, config_service_1.ConfigService],
                    useFactory: ({ command, argv }, runner, configService) => __awaiter(this, void 0, void 0, function* () {
                        try {
                            let settings;
                            const configFilename = 'xmigrate';
                            if (yield util_1.promisify(fs_1.exists)(`./${configFilename}.ts`)) {
                                const isMigrateTempConfigExists = yield util_1.promisify(fs_1.exists)('./.xmigrate/config.temp');
                                const TranspileAndWriteTemp = (stats) => __awaiter(this, void 0, void 0, function* () {
                                    yield typescript_builder_1.TranspileTypescript([`/${configFilename}.ts`], config.outDir);
                                    console.log('Transpile complete!');
                                    yield util_1.promisify(fs_1.writeFile)('./.xmigrate/config.temp', stats.mtime.toISOString(), { encoding: 'utf-8' });
                                });
                                const stats = yield util_1.promisify(fs_1.stat)(`./${configFilename}.ts`);
                                if (isMigrateTempConfigExists) {
                                    const temp = yield util_1.promisify(fs_1.readFile)('./.xmigrate/config.temp', { encoding: 'utf-8' });
                                    if (new Date(temp).toISOString() !== stats.mtime.toISOString()) {
                                        console.log('Xmigrate configuration has changed transpiling...');
                                        yield TranspileAndWriteTemp(stats);
                                    }
                                }
                                else {
                                    console.log('Transpile xmigrate.ts...');
                                    yield TranspileAndWriteTemp(stats);
                                }
                                settings = require(path_1.join(process.cwd(), `./${config.outDir}`, `${configFilename}.js`));
                                try {
                                    yield util_1.promisify(fs_1.unlink)(path_1.join('./', config.outDir, 'xmigrate.js.map'));
                                }
                                catch (e) { }
                            }
                            else {
                                settings = require('esm')(module)(path_1.join(process.cwd(), `./${configFilename}.js`));
                            }
                            if (settings.default) {
                                settings = yield settings.default();
                            }
                            else {
                                settings = (yield settings());
                            }
                            configService.set(settings);
                        }
                        catch (e) { }
                        yield helpers_1.ensureDir(configService.config.logger.folder);
                        yield helpers_1.ensureDir(configService.config.migrationsDir);
                        let hasCrashed;
                        if (command === 'create') {
                            hasCrashed = yield runner.run('create', {
                                name: argv[1],
                                template: args_extractors_1.nextOrDefault('--template', null)
                            });
                        }
                        else if (command === 'up') {
                            hasCrashed = yield runner.run('up', {
                                rollback: args_extractors_1.includes('--rollback')
                            });
                        }
                        else {
                            hasCrashed = yield runner.run(command);
                        }
                        if (hasCrashed) {
                            return process.exit(1);
                        }
                        process.exit(0);
                    })
                }
            ]
        };
    }
};
MigrationsModule = MigrationsModule_1 = __decorate([
    core_1.Module()
], MigrationsModule);
exports.MigrationsModule = MigrationsModule;
