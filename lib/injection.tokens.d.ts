import { InjectionToken } from '@rxdi/core';
import { MongoClient } from 'mongodb';
import { TemplateTypes } from './templates';
export interface ReturnType {
    appliedAt: Date | string;
    fileName: string;
    result: any;
}
export declare const LoggerConfig: InjectionToken<unknown>;
export declare const Config: InjectionToken<unknown>;
export declare type MigrationSchema = {
    down: (db: MongoClient) => unknown;
    up: (db: MongoClient) => unknown;
};
export interface LoggerConfig {
    folder: string;
    up: {
        success: string;
        error: string;
    };
    down: {
        success: string;
        error: string;
    };
}
export interface Config {
    mongodb: {
        url: string;
        databaseName: string;
        options: {
            useNewUrlParser: boolean;
        };
    };
    outDir: string;
    migrationsDir?: string;
    changelogCollectionName?: string;
    logger?: LoggerConfig;
    defaultTemplate?: TemplateTypes;
    typescript?: boolean;
}
export declare type Tasks = 'up' | 'down' | 'status' | 'create' | '--template' | '--rollback';
export declare const CommandInjector: InjectionToken<unknown>;
