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
const mongodb_1 = require("mongodb");
const mongoose_1 = require("mongoose");
const config_service_1 = require("../config/config.service");
let DatabaseService = class DatabaseService {
    constructor(configService) {
        this.configService = configService;
        this.connections = new Map();
        this.connectionsMongoose = new Map();
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = this.configService.config.mongodb.url;
            const databaseName = this.configService.config.mongodb.databaseName;
            if (!url) {
                throw new Error('No `url` defined in config file!');
            }
            if (!databaseName) {
                throw new Error('No `databaseName` defined in config file! This is required since migrate-mongo v3. ' +
                    'See https://github.com/seppevs/migrate-mongo#initialize-a-new-project');
            }
            const client = yield this.getMongoClient().connect(url, this.configService.config.mongodb.options);
            const originalDb = client.db.bind(client);
            client.db = (dbName) => originalDb(dbName || databaseName);
            this.setConnections(url, client);
            return client;
        });
    }
    getMongoClient() {
        return mongodb_1.MongoClient;
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all([...this.connections.values()].map(c => c.close(true)));
        });
    }
    closeMongoose() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all([...this.connectionsMongoose.values()].map(c => c.disconnect()));
        });
    }
    setConnections(url, client) {
        this.connections.set(url, client);
    }
    setConnectionsMongoose(url, client) {
        this.connectionsMongoose.set(url, client);
    }
    connectMongoose() {
        return mongoose_1.connect;
    }
    mongooseConnect() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.configService.config.mongodb.url}/${this.configService.config.mongodb.databaseName}`;
            const connection = yield this.connectMongoose()(url, this.configService.config.mongodb.options);
            this.setConnectionsMongoose(url, connection);
            return connection;
        });
    }
};
DatabaseService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [config_service_1.ConfigService])
], DatabaseService);
exports.DatabaseService = DatabaseService;
