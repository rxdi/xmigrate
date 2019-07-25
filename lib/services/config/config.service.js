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
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
const injection_tokens_1 = require("../../injection.tokens");
const default_config_1 = require("../../default.config");
let ConfigService = class ConfigService {
    constructor(initConfig) {
        this.initConfig = initConfig;
        this.config = default_config_1.DEFAULT_CONFIG;
    }
    set(config) {
        this.config = Object.assign(config, this.initConfig);
    }
    get() {
        return this.config;
    }
};
ConfigService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [Object])
], ConfigService);
exports.ConfigService = ConfigService;
