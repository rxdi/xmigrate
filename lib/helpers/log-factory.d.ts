/// <reference types="node" />
import { LoggerConfig } from '../injection.tokens';
import { WriteStream } from 'fs';
declare class Logger {
    successLogger: WriteStream;
    errorLogger: WriteStream;
    constructor(successPath: string, errorPath: string);
    log(res: unknown): void;
    error(res: unknown): void;
    getLogTemplate(res: unknown, emoji: string): string;
}
export declare class LogFactory {
    private config;
    loggers: Map<string, Logger>;
    constructor(config: LoggerConfig);
    getDownLogger(): Logger;
    getUpLogger(): Logger;
    getConfig(type: 'up' | 'down'): {
        successPath: string;
        errorPath: string;
    };
    create(name: string, { successPath, errorPath }: {
        successPath: any;
        errorPath: any;
    }): Logger;
    has(name: string): boolean;
    get(name: string): Logger;
}
export {};
