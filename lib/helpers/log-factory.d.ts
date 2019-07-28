/// <reference types="node" />
import { LoggerConfig } from '../injection.tokens';
import { WriteStream } from 'fs';
export declare class Logger {
    successLogger: WriteStream;
    errorLogger: WriteStream;
    constructor(successPath: string, errorPath: string);
    log(res: unknown): void;
    error(res: unknown): void;
    close(): void;
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
    closeConnections(): void;
    create(name: string, { successPath, errorPath }: {
        successPath: string;
        errorPath: string;
    }): Logger;
    has(name: string): boolean;
    get(name: string): Logger;
}
