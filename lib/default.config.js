"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = {
    changelogCollectionName: 'migrations',
    migrationsDir: 'migrations',
    defaultTemplate: 'es6',
    typescript: true,
    outDir: './.xmigrate',
    logger: {
        folder: './migrations-log',
        up: {
            success: 'up.success.log',
            error: 'up.error.log'
        },
        down: {
            success: 'down.success.log',
            error: 'down.error.log'
        }
    },
    mongodb: {
        url: 'mongodb://localhost:27017',
        databaseName: 'test',
        options: {
            useNewUrlParser: true
        }
    }
};
