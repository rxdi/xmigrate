declare module '@test/templates/native' {
	 const _default: "\nexport async function up (client) {\n  await client\n    .db()\n    .collection('albums')\n    .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: true } })\n  await client\n    .db()\n    .collection('albums')\n    .updateOne({ artist: 'The Doors' }, { $set: { stars: 5 } })\n},\n\nexport async function down (client) {\n  await client\n    .db()\n    .collection('albums')\n    .updateOne({ artist: 'The Doors' }, { $set: { stars: 0 } })\n  await client\n    .db()\n    .collection('albums')\n    .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: false } })\n}\n";
	export default _default;

}
declare module '@test/templates/es5' {
	 const _default: "\nmodule.exports = {\n  async up (client) {\n    return ['Up']\n  },\n\n  async down (client) {\n    return ['Down']\n  }\n}\n";
	export default _default;

}
declare module '@test/templates/es6' {
	 const _default: "\nexport async function up(client) {\n  return ['Up'];\n}\nexport async function down(client) {\n  return ['Down'];\n}\n";
	export default _default;

}
declare module '@test/templates/typescript' {
	 const _default: "\nimport { MongoClient } from 'mongodb';\n\nexport async function up(client: MongoClient) {\n  await client\n    .db()\n    .collection('albums')\n    .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: true } });\n\n  await client\n    .db()\n    .collection('albums')\n    .updateOne({ artist: 'The Doors' }, { $set: { stars: 5 } });\n}\nexport async function down(client: MongoClient) {\n  await client\n    .db()\n    .collection('albums')\n    .updateOne({ artist: 'The Doors' }, { $set: { stars: 0 } });\n\n  await client\n    .db()\n    .collection('albums')\n    .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: false } });\n}\n\n";
	export default _default;

}
declare module '@test/templates/migration' {
	 const _default: "module.exports = async () => {\n  return {\n    changelogCollectionName: 'migrations',\n    migrationsDir: 'migrations',\n    defaultTemplate: 'es6',\n    outDir: './.xmigrate',\n    typescript: true,\n    logger: {\n      folder: './migrations-log',\n      up: {\n        success: 'up.success.log',\n        error: 'up.error.log'\n      },\n      down: {\n        success: 'down.success.log',\n        error: 'down.error.log'\n      }\n    },\n    mongodb: {\n      url: 'mongodb://localhost:27017',\n      databaseName: 'test',\n      options: {\n        useNewUrlParser: true\n      }\n    },\n  };\n};\n";
	export default _default;

}
declare module '@test/templates/index' {
	import native from '@test/templates/native';
	import es5 from '@test/templates/es5';
	import es6 from '@test/templates/es6';
	import typescript from '@test/templates/typescript';
	import migration from '@test/templates/migration';
	export { es6, es5, native, typescript, migration };
	export type TemplateTypes = 'es5' | 'es6' | 'native' | 'typescript' | 'migration';

}
declare module '@test/injection.tokens' {
	import { MongoClient } from 'mongodb';
	import { TemplateTypes } from '@test/templates';
	export interface ReturnType {
	    appliedAt: Date | string;
	    fileName: string;
	    result: any;
	}
	export const LoggerConfig: any;
	export const Config: any;
	export type MigrationSchema = {
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
	export type Tasks = 'up' | 'down' | 'status' | 'create' | '--template' | '--rollback';
	export const CommandInjector: any;

}
declare module '@test/helpers/log-factory' {
	/// <reference types="node" />
	import { LoggerConfig } from '@test/injection.tokens';
	import { WriteStream } from 'fs';
	export class Logger {
	    successLogger: WriteStream;
	    errorLogger: WriteStream;
	    errorFinished: boolean;
	    successFinished: boolean;
	    constructor(successPath: string, errorPath: string);
	    log(res: unknown): Promise<unknown>;
	    error(res: unknown): Promise<unknown>;
	    close(): void;
	    getLogTemplate(res: unknown, emoji: string): string;
	}
	export class LogFactory {
	    private config;
	    loggers: Map<string, Logger>;
	    constructor(config: LoggerConfig);
	    getDownLogger(): Logger;
	    getUpLogger(): Logger;
	    getConfig(type: 'up' | 'down'): {
	        successPath: string;
	        errorPath: string;
	    };
	    closeConnections(): void;
	    create(name: string, { successPath, errorPath }: {
	        successPath: string;
	        errorPath: string;
	    }): Logger;
	    has(name: string): boolean;
	    get(name: string): Logger;
	}

}
declare module '@test/default.config' {
	import { Config } from '@test/injection.tokens';
	export const DEFAULT_CONFIG: Config;

}
declare module '@test/services/config/config.service' {
	import { Config } from '@test/injection.tokens';
	export class ConfigService {
	    config: Config;
	    set(config: Config): void;
	}

}
declare module '@test/services/database/database.service' {
	import { MongoClient } from 'mongodb';
	import { connect, Mongoose } from 'mongoose';
	import { ConfigService } from '@test/services/config/config.service';
	export class DatabaseService {
	    private configService;
	    connections: Map<string, MongoClient>;
	    connectionsMongoose: Map<string, Mongoose>;
	    constructor(configService: ConfigService);
	    connect(): Promise<MongoClient>;
	    getMongoClient(): typeof MongoClient;
	    close(): Promise<void>;
	    closeMongoose(): Promise<void>;
	    setConnections(url: string, client: MongoClient): void;
	    setConnectionsMongoose(url: string, client: Mongoose): void;
	    connectMongoose(): typeof connect;
	    mongooseConnect(): Promise<typeof import("mongoose")>;
	}

}
declare module '@test/helpers/date' {
	export const now: (dateString?: number) => Date;
	export const nowAsString: () => any;

}
declare module '@test/helpers/typescript-builder' {
	export const TranspileTypescript: (paths: string[], outDir: string) => Promise<unknown>;

}
declare module '@test/services/migrations-resolver/migrations-resolver.service' {
	import { MigrationSchema } from '@test/injection.tokens';
	import { ConfigService } from '@test/services/config/config.service';
	export class MigrationsResolver {
	    private configService;
	    constructor(configService: ConfigService);
	    getFileNames(): Promise<string[]>;
	    readDir(): Promise<string[]>;
	    getDistFileNames(): Promise<string[]>;
	    isTypescript(file: string): boolean;
	    loadMigration(fileName: string, cwd?: string): Promise<MigrationSchema>;
	    getFilePath(fileName: string): string;
	    getRelativePath(fileName: string): string;
	    clean(migrations: string[]): Promise<boolean>;
	    deleteArtefacts(fileName: string): Promise<void>;
	    delete(path: string): Promise<unknown>;
	    loadTsCompiledMigration(fileName: string): Promise<any>;
	    transpileMigrations(migrations: string[]): Promise<void>;
	    getTsCompiledFilePath(fileName: string): string;
	    replaceFilenameJsWithTs(fileName: string): string;
	}

}
declare module '@test/helpers/error' {
	import { ReturnType } from '@test/injection.tokens';
	export class ErrorMap extends Error implements ReturnType {
	    fileName: string;
	    downgraded: ReturnType[];
	    appliedAt: string | Date;
	    result: unknown;
	    migrated: ReturnType[];
	}

}
declare module '@test/services/migration/migration.service' {
	import { DatabaseService } from '@test/services/database/database.service';
	import { ReturnType } from '@test/injection.tokens';
	import { TemplateTypes } from '@test/templates/index';
	import { MigrationsResolver } from '@test/services/migrations-resolver/migrations-resolver.service';
	import { LogFactory } from '@test/helpers/log-factory';
	import { ConfigService } from '@test/services/config/config.service';
	export class MigrationService {
	    private configService;
	    private database;
	    private migrationsResolver;
	    private logger;
	    constructor(configService: ConfigService, database: DatabaseService, migrationsResolver: MigrationsResolver, logger: LogFactory);
	    connect(): Promise<import("mongodb").MongoClient>;
	    up(): Promise<ReturnType[]>;
	    down(): Promise<ReturnType[]>;
	    createWithTemplate(template: TemplateTypes, name: string, config?: {
	        raw: boolean;
	        typescript?: boolean;
	    }): Promise<string>;
	    private writeConfig;
	    init(): Promise<void>;
	    create({ name, template }: {
	        name: string;
	        template: TemplateTypes;
	    }): Promise<void>;
	    statusInternal(): Promise<ReturnType[]>;
	    status(): Promise<{
	        status: boolean;
	        result: ReturnType[];
	    }>;
	    printStatus(status: ReturnType[], type?: 'table'): void;
	}

}
declare module '@test/services/generic-runner/generic-runner.service' {
	import { Tasks } from '@test/injection.tokens';
	import { LogFactory } from '@test/helpers/log-factory';
	import { MigrationService } from '@test/services/migration/migration.service';
	import { ConfigService } from '@test/services/config/config.service';
	import { MigrationsResolver } from '@test/services/migrations-resolver/migrations-resolver.service';
	export class GenericRunner {
	    private logger;
	    private configService;
	    private resolver;
	    private migrationService;
	    private tasks;
	    constructor(logger: LogFactory, configService: ConfigService, resolver: MigrationsResolver, migrationService: MigrationService);
	    setTasks(tasks: any[]): void;
	    run(name: Tasks, args?: any): Promise<boolean>;
	    private rollback;
	    bind(self: MigrationService): this;
	    private logEnvironment;
	}

}
declare module '@test/helpers/args-extractors' {
	import { Tasks } from '@test/injection.tokens';
	export const includes: (i: Tasks) => boolean;
	export const nextOrDefault: (i: Tasks, fb?: any, type?: (p: string) => string) => any;

}
declare module '@test/helpers/ensure-folder' {
	export function ensureDir(dirpath: string): Promise<void>;

}
declare module '@test/helpers/index' {
	export * from '@test/helpers/args-extractors';
	export * from '@test/helpers/date';
	export * from '@test/helpers/ensure-folder';
	export * from '@test/helpers/error';
	export * from '@test/helpers/log-factory';

}
declare module '@test/migrations.module' {
	import { ModuleWithProviders } from '@rxdi/core';
	import { Config } from '@test/injection.tokens';
	export class MigrationsModule {
	    static forRoot(config?: Config): ModuleWithProviders;
	}

}
declare module '@test/app.module' {
	export class AppModule {
	}

}
declare module '@test/services/index' {
	export * from '@test/services/database/database.service';
	export * from '@test/services/generic-runner/generic-runner.service';
	export * from '@test/services/migration/migration.service';
	export * from '@test/services/migrations-resolver/migrations-resolver.service';
	export * from '@test/services/config/config.service';

}
declare module '@test' {
	export * from '@test/services';
	export * from '@test/helpers';
	export * from '@test/templates';
	export * from '@test/migrations.module';
	export * from '@test/injection.tokens';
	export * from '@test/default.config';

}
declare module '@test/main' {
	export {};

}
