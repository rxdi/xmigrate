import { InjectionToken } from '@rxdi/core';
import { Db } from 'mongodb';
import { TemplateTypes } from './templates';

export interface ReturnType {
  appliedAt: Date | string;
  fileName: string;
  result: any;
}

export const LoggerConfig = new InjectionToken('logger-config');
export const Config = new InjectionToken('migrations-config');
export type MigrationSchema = {
  down: (db: Db) => unknown;
  up: (db: Db) => unknown;
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
      useNewUrlParser: true;
    };
  };
  migrationsDir: string;
  changelogCollectionName: string;
  logger: LoggerConfig;
  defaultTemplate?: TemplateTypes;
  typescript?: boolean;
}

export type Tasks = 'up' | 'down' | 'status' | 'create' | '--template' | '--fallback';


export const CommandInjector = new InjectionToken('CommandInjector');