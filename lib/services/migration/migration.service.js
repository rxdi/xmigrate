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
const database_service_1 = require("../database/database.service");
const core_1 = require("@rxdi/core");
const util_1 = require("util");
const fs_1 = require("fs");
const date_1 = require("../../helpers/date");
const templates = require("../../templates/index");
const migrations_resolver_service_1 = require("../migrations-resolver/migrations-resolver.service");
const chalk_1 = require("chalk");
const path_1 = require("path");
const log_factory_1 = require("../../helpers/log-factory");
const error_1 = require("../../helpers/error");
const config_service_1 = require("../config/config.service");
let MigrationService = class MigrationService {
    constructor(configService, database, migrationsResolver, logger) {
        this.configService = configService;
        this.database = database;
        this.migrationsResolver = migrationsResolver;
        this.logger = logger;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.database.mongooseConnect();
            return this.database.connect();
        });
    }
    up() {
        return __awaiter(this, void 0, void 0, function* () {
            const statusItems = yield this.statusInternal();
            const pendingItems = statusItems.filter(item => item.appliedAt === 'PENDING');
            const migrated = [];
            const client = yield this.connect();
            const logger = this.logger.getUpLogger();
            const typescriptMigrations = pendingItems
                .filter(item => this.migrationsResolver.isTypescript(item.fileName))
                .map(m => m.fileName);
            if (typescriptMigrations.length) {
                yield this.migrationsResolver.transpileMigrations(typescriptMigrations);
            }
            const migrateItem = (item) => __awaiter(this, void 0, void 0, function* () {
                let result;
                try {
                    const migration = yield this.migrationsResolver.loadMigration(item.fileName);
                    result = yield migration.up(client);
                }
                catch (err) {
                    const error = new error_1.ErrorMap(err.message);
                    error.fileName = item.fileName;
                    error.migrated = migrated;
                    yield logger.error({
                        migrated,
                        errorMessage: error.message,
                        fileName: item.fileName
                    });
                    throw error;
                }
                const collection = client
                    .db()
                    .collection(this.configService.config.changelogCollectionName);
                const { fileName } = item;
                const appliedAt = new Date();
                try {
                    yield collection.insertOne({ fileName, appliedAt });
                }
                catch (err) {
                    yield logger.error({
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
                yield logger.log(res);
                migrated.push(res);
                return yield true;
            });
            for (const item of pendingItems) {
                yield migrateItem(item);
            }
            yield this.migrationsResolver.clean(typescriptMigrations);
            this.printStatus(migrated);
            return migrated;
        });
    }
    down() {
        return __awaiter(this, void 0, void 0, function* () {
            const downgraded = [];
            const statusItems = yield this.statusInternal();
            const appliedItems = statusItems.filter(item => item.appliedAt !== 'PENDING');
            const lastAppliedItem = appliedItems[appliedItems.length - 1];
            if (!lastAppliedItem) {
                return;
            }
            const isTypescript = this.migrationsResolver.isTypescript(lastAppliedItem.fileName);
            let result;
            if (appliedItems.length && lastAppliedItem) {
                const logger = this.logger.getDownLogger();
                const client = yield this.connect();
                if (isTypescript) {
                    yield this.migrationsResolver.transpileMigrations([
                        lastAppliedItem.fileName
                    ]);
                }
                try {
                    const migration = yield this.migrationsResolver.loadMigration(lastAppliedItem.fileName);
                    result = yield migration.down(client);
                }
                catch (err) {
                    const error = new error_1.ErrorMap(err.message);
                    error.fileName = lastAppliedItem.fileName;
                    error.downgraded = downgraded;
                    yield logger.error({
                        downgraded,
                        errorMessage: err.message,
                        fileName: lastAppliedItem.fileName
                    });
                    throw error;
                }
                const collection = client
                    .db()
                    .collection(this.configService.config.changelogCollectionName);
                try {
                    yield collection.deleteOne({ fileName: lastAppliedItem.fileName });
                    const res = {
                        fileName: lastAppliedItem.fileName,
                        appliedAt: new Date(),
                        result
                    };
                    yield logger.log(res);
                    downgraded.push(res);
                }
                catch (err) {
                    yield logger.error({
                        downgraded,
                        errorMessage: err.message,
                        fileName: lastAppliedItem.fileName
                    });
                    throw new Error(`Could not update changelog: ${err.message}`);
                }
            }
            if (lastAppliedItem) {
                yield this.migrationsResolver.clean([lastAppliedItem.fileName]);
            }
            this.printStatus(downgraded);
            return downgraded;
        });
    }
    createWithTemplate(template, name, config = {
        raw: false,
        typescript: false
    }) {
        return __awaiter(this, void 0, void 0, function* () {
            let rawTemplate = templates[template];
            if (config.raw) {
                rawTemplate = template;
            }
            else if (!rawTemplate) {
                throw new Error(`🔥  *** Missing template ${template} ***`);
            }
            const isTypescript = config.typescript || template === 'typescript';
            const filePath = path_1.normalize(`./${this.configService.config.migrationsDir}/${date_1.nowAsString()}-${name}.${isTypescript ? 'ts' : 'js'}`);
            yield util_1.promisify(fs_1.writeFile)(filePath, rawTemplate, {
                encoding: 'utf-8'
            });
            return '/' + filePath;
        });
    }
    writeConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            yield util_1.promisify(fs_1.writeFile)('./xmigrate.js', templates.migration, {
                encoding: 'utf-8'
            });
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const gitIgnore = yield util_1.promisify(fs_1.readFile)('./.gitignore', {
                encoding: 'utf-8'
            });
            const stream = fs_1.createWriteStream('./.gitignore', { flags: 'a' });
            if (!gitIgnore.includes('.cache')) {
                stream.write('\n.cache');
            }
            if (!gitIgnore.includes('.xmigrate')) {
                stream.write('\n.xmigrate');
            }
            stream.end();
            yield this.writeConfig();
        });
    }
    create({ name, template }) {
        return __awaiter(this, void 0, void 0, function* () {
            const customTemplate = template || this.configService.config.defaultTemplate;
            const fileName = yield this.createWithTemplate(customTemplate, name);
            console.log(`
\n🚀  ${chalk_1.default.bold('Template:')} "${chalk_1.default.blue(customTemplate)}"!
\n💾  ${chalk_1.default.bold('File:')} ${chalk_1.default.blue(path_1.normalize(`${process.cwd()}//${fileName}`))}
\n🚀  ${chalk_1.default.green.bold('Migration template created!')}
`);
        });
    }
    statusInternal() {
        return __awaiter(this, void 0, void 0, function* () {
            const fileNames = yield this.migrationsResolver.getFileNames();
            const client = yield this.connect();
            const collection = client
                .db()
                .collection(this.configService.config.changelogCollectionName);
            const changelog = yield collection.find({}).toArray();
            return fileNames.map((fileName) => {
                const itemInLog = changelog.find(log => log.fileName === fileName);
                const appliedAt = itemInLog
                    ? itemInLog.appliedAt.toJSON()
                    : 'PENDING';
                return { fileName, appliedAt, result: null };
            });
        });
    }
    status() {
        return __awaiter(this, void 0, void 0, function* () {
            const statusTable = yield this.statusInternal();
            this.printStatus(statusTable, 'table');
            return {
                status: true,
                result: statusTable.filter(i => i.appliedAt === 'PENDING')
            };
        });
    }
    printStatus(status, type) {
        if (type === 'table' && status.length) {
            return console.table(status, ['fileName', 'appliedAt']);
        }
        status.forEach((item, index) => console.log(`
#️⃣  ${chalk_1.default.white.bold(String(index + 1))}
${chalk_1.default.blue('-'.repeat(process.stdout.columns))}
📁  ${chalk_1.default.bold(`Filename:`)} ${chalk_1.default.green(item.fileName)}
⏱️  ${chalk_1.default.bold(`Applied at:`)} ${chalk_1.default.green(String(item.appliedAt))}
${chalk_1.default.blue('-'.repeat(process.stdout.columns))}
    `));
    }
};
MigrationService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [config_service_1.ConfigService,
        database_service_1.DatabaseService,
        migrations_resolver_service_1.MigrationsResolver,
        log_factory_1.LogFactory])
], MigrationService);
exports.MigrationService = MigrationService;
