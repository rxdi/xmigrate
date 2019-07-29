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
const core_1 = require("@rxdi/core");
const fs_1 = require("fs");
const path_1 = require("path");
const util_1 = require("util");
const config_service_1 = require("../config/config.service");
const typescript_builder_1 = require("../../helpers/typescript-builder");
let MigrationsResolver = class MigrationsResolver {
    constructor(configService) {
        this.configService = configService;
    }
    getFileNames() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield util_1.promisify(fs_1.readdir)(this.configService.config.migrationsDir)).filter(file => path_1.extname(file) === '.js' || this.isTypescript(file));
        });
    }
    readDir() {
        return util_1.promisify(fs_1.readdir)(this.configService.config.outDir);
    }
    getDistFileNames() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.readDir())
                .filter(file => path_1.extname(file) === '.js')
                .map(f => this.getTsCompiledFilePath(f));
        });
    }
    isTypescript(file) {
        return path_1.extname(file) === '.ts' && this.configService.config.typescript;
    }
    loadMigration(fileName, cwd) {
        return __awaiter(this, void 0, void 0, function* () {
            let migration;
            if (this.isTypescript(fileName)) {
                migration = yield this.loadTsCompiledMigration(fileName);
            }
            else {
                migration = require('esm')(module)(this.getFilePath(fileName));
            }
            return migration;
        });
    }
    getFilePath(fileName) {
        return path_1.join(process.cwd(), this.configService.config.migrationsDir, fileName);
    }
    getRelativePath(fileName) {
        return this.getFilePath(fileName).replace(process.cwd(), '');
    }
    clean(migrations) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(migrations.map(fileName => this.deleteArtefacts(fileName)));
            return true;
        });
    }
    deleteArtefacts(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.delete(this.getTsCompiledFilePath(fileName));
            yield this.delete(this.getTsCompiledFilePath(`${fileName}.map`));
        });
    }
    delete(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => fs_1.unlink(path, () => resolve(true)));
        });
    }
    loadTsCompiledMigration(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            return require(this.getTsCompiledFilePath(fileName));
        });
    }
    transpileMigrations(migrations) {
        return __awaiter(this, void 0, void 0, function* () {
            yield typescript_builder_1.TranspileTypescript(migrations.map(fileName => this.getRelativePath(fileName)), this.configService.config.outDir);
        });
    }
    getTsCompiledFilePath(fileName) {
        return path_1.join(process.cwd(), this.configService.config.outDir, this.replaceFilenameJsWithTs(fileName));
    }
    replaceFilenameJsWithTs(fileName) {
        return fileName.replace('ts', 'js');
    }
};
MigrationsResolver = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [config_service_1.ConfigService])
], MigrationsResolver);
exports.MigrationsResolver = MigrationsResolver;
