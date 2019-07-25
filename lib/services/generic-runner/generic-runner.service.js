"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const chalk_1 = require("chalk");
const log_factory_1 = require("../../helpers/log-factory");
const core_1 = require("@rxdi/core");
const config_service_1 = require("../config/config.service");
let GenericRunner = class GenericRunner {
    constructor(logger, configService) {
        this.logger = logger;
        this.configService = configService;
        this.tasks = new Map();
    }
    setTasks(tasks) {
        this.tasks = new Map(tasks);
    }
    run(name, args) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.logEnvironment(name);
            const logger = this.logger.getDownLogger();
            if (!this.tasks.has(name)) {
                throw new Error('\n🔥  Missing command');
            }
            try {
                const res = yield this.tasks.get(name)(args);
                if (res && res.status && res.result.length) {
                    console.log(`
          \n🔥  There are ${chalk_1.default.red(res.result.length)} migration with status '${chalk_1.default.red('PENDING')}' run '${chalk_1.default.green(`xmigrate up`)}' command!
          `);
                }
                else {
                    console.log(`
        \n🚀  ${chalk_1.default.green.bold(res && res.length
                        ? `Success! Runned ${res.length} migrations.`
                        : 'Already up to date')}
        `);
                }
                setTimeout(() => process.exit(0), 0);
            }
            catch (e) {
                console.error(`
      \n🔥  ${chalk_1.default.bold('Status: Operation executed with error')}
🧨  ${chalk_1.default.bold('Error: ' + JSON.stringify(e))}
📨  ${chalk_1.default.bold('Message: ' + e.message)}
      `);
                if (args && args.fallback) {
                    try {
                        yield this.fallback(e.fileName);
                    }
                    catch (err) {
                        console.log('\n🔥  Migration fallback exited with error  ', err);
                        logger.error({
                            errorMessage: err.message,
                            fileName: e.fileName
                        });
                    }
                }
                setTimeout(() => process.exit(1), 0);
            }
        });
    }
    fallback(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = {
                fileName
            };
            const logger = this.logger.getDownLogger();
            const { migrationsDir } = this.configService.config;
            const migrationPath = path_1.normalize(`${process.cwd()}/${migrationsDir}/${fileName}`);
            console.log(`
\n🙏  ${chalk_1.default.bold('Status: Executing fallback operation')} ${chalk_1.default.red('xmigrate down')}
📁  ${chalk_1.default.bold('Migration:')} ${migrationPath}
      `);
            response.appliedAt = new Date();
            response.result = yield require(migrationPath).down();
            console.log(`\n🚀  ${chalk_1.default.green('Fallback operation success, nothing changed if written correctly!')}`);
            logger.log(response);
            return response;
        });
    }
    bind(self) {
        // Binds appropriate `this` to tasks
        Array.from(this.tasks.keys()).map(k => this.tasks.set(k, this.tasks.get(k).bind(self)));
        return this;
    }
    logEnvironment(taskName) {
        return __awaiter(this, void 0, void 0, function* () {
            const { mongodb: { databaseName }, migrationsDir, logger: { folder }, changelogCollectionName } = this.configService.config;
            console.log(`
    \n🖥️  ${chalk_1.default.bold('Database:')} ${chalk_1.default.blue.bold(databaseName)}
    \n💿  ${chalk_1.default.bold('DBCollection:')} ${chalk_1.default.blue.bold(changelogCollectionName)}
    \n🗄️  ${chalk_1.default.bold('LoggerDir:')} ${chalk_1.default.blue.bold(folder)}
    \n📁  ${chalk_1.default.bold('MigrationsDir:')} ${chalk_1.default.blue.bold(migrationsDir)}
    \n👷  ${chalk_1.default.bold('Script:')} ${chalk_1.default.blue.bold(`xmigrate ${taskName}`)}
    `);
        });
    }
};
GenericRunner = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [log_factory_1.LogFactory,
        config_service_1.ConfigService])
], GenericRunner);
exports.GenericRunner = GenericRunner;
