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
const path_1 = require("path");
const config_service_1 = require("./services/config/config.service");
let MigrationsModule = MigrationsModule_1 = class MigrationsModule {
    static forRoot(config = default_config_1.DEFAULT_CONFIG) {
        return {
            module: MigrationsModule_1,
            providers: [
                generic_runner_service_1.GenericRunner,
                log_factory_1.LogFactory,
                {
                    provide: injection_tokens_1.Config,
                    useValue: config
                },
                config_service_1.ConfigService,
                {
                    provide: injection_tokens_1.LoggerConfig,
                    useValue: config.logger
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
                            ['create', migrationService.create]
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
                            configService.set(yield require(path_1.join(process.cwd(), './xmigrate.js'))(configService));
                        }
                        catch (e) { }
                        if (command === 'create') {
                            return runner.run(command, {
                                name: argv[1],
                                template: args_extractors_1.nextOrDefault('--template', null)
                            });
                        }
                        if (command === 'up') {
                            return runner.run(command, {
                                fallback: args_extractors_1.includes('--fallback')
                            });
                        }
                        return runner.run(command);
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
