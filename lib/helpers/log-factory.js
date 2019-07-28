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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
const injection_tokens_1 = require("../injection.tokens");
const fs_1 = require("fs");
class Logger {
    constructor(successPath, errorPath) {
        this.successLogger = fs_1.createWriteStream(successPath, {
            flags: 'a'
        });
        this.errorLogger = fs_1.createWriteStream(errorPath, {
            flags: 'a'
        });
        this.successLogger.on('finish', () => {
            this.successFinished = true;
            console.log('All writes are now complete. for Success logger');
        });
        this.errorLogger.on('finish', () => {
            this.errorFinished = true;
            console.log('All writes are now complete. for Error logger');
        });
    }
    log(res) {
        return new Promise(resolve => {
            if (!this.successFinished) {
                return this.successLogger.write(this.getLogTemplate(res, '🚀'), resolve);
            }
            resolve();
        });
    }
    error(res) {
        return new Promise(resolve => {
            if (!this.errorFinished) {
                return this.errorLogger.write(this.getLogTemplate(res, '🔥'), resolve);
            }
            resolve();
        });
    }
    close() {
        this.successLogger.close();
        this.errorLogger.close();
        this.successLogger.end();
        this.errorLogger.end();
    }
    getLogTemplate(res, emoji) {
        return `
${emoji} ********* ${new Date()} *********
\n${JSON.stringify(res, null, 2)}
`;
    }
}
exports.Logger = Logger;
let LogFactory = class LogFactory {
    constructor(config) {
        this.config = config;
        this.loggers = new Map();
    }
    getDownLogger() {
        return this.create('down', this.getConfig('down'));
    }
    getUpLogger() {
        return this.create('up', this.getConfig('up'));
    }
    getConfig(type) {
        return {
            successPath: `${this.config.folder}/${this.config[type].success}`,
            errorPath: `${this.config.folder}/${this.config[type].error}`
        };
    }
    closeConnections() {
        [...this.loggers.values()].forEach(logger => logger.close());
    }
    create(name, { successPath, errorPath }) {
        if (this.has(name)) {
            return this.get(name);
        }
        this.loggers.set(name, new Logger(successPath, errorPath));
        return this.get(name);
    }
    has(name) {
        return this.loggers.has(name);
    }
    get(name) {
        return this.loggers.get(name);
    }
};
LogFactory = __decorate([
    core_1.Injectable(),
    __param(0, core_1.Inject(injection_tokens_1.LoggerConfig)),
    __metadata("design:paramtypes", [Object])
], LogFactory);
exports.LogFactory = LogFactory;
