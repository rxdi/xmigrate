"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const date_fns_1 = require("date-fns");
exports.now = (dateString = Date.now()) => {
    const date = new Date(dateString);
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
};
exports.nowAsString = () => date_fns_1.format(exports.now(), 'yyyymmddhhmmss');
