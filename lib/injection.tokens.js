"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
exports.LoggerConfig = new core_1.InjectionToken('logger-config');
exports.Config = new core_1.InjectionToken('migrations-config');
exports.CommandInjector = new core_1.InjectionToken('CommandInjector');
