import { Inject, Injectable } from '@rxdi/core';
import { createWriteStream, WriteStream } from 'fs';

import { LoggerConfig } from '../injection.tokens';

export class Logger {
  successLogger: WriteStream;
  errorLogger: WriteStream;
  errorFinished: boolean;
  successFinished: boolean;
  constructor(successPath: string, errorPath: string) {
    this.successLogger = createWriteStream(successPath, {
      flags: 'a',
    });
    this.errorLogger = createWriteStream(errorPath, {
      flags: 'a',
    });
    this.successLogger.on('finish', () => {
      this.successFinished = true;
      console.log('All writes are now complete. for Success logger');
    });
    this.errorLogger.on('finish', () => {
      this.errorFinished = true;
      console.log('All writes are now complete. for Error logger');
    });
  }
  log(res: unknown) {
    return new Promise((resolve) => {
      if (!this.successFinished) {
        return this.successLogger.write(
          this.getLogTemplate(res, '🚀'),
          resolve,
        );
      }
      resolve();
    });
  }
  error(res: unknown) {
    return new Promise((resolve) => {
      if (!this.errorFinished) {
        return this.errorLogger.write(this.getLogTemplate(res, '🔥'), resolve);
      }
      resolve();
    });
  }

  close() {
    this.successLogger.close();
    this.errorLogger.close();
    this.successLogger.end();
    this.errorLogger.end();
  }

  getLogTemplate(res: unknown, emoji: string) {
    return `
${emoji} ********* ${new Date()} *********
\n${JSON.stringify(res, null, 2)}
`;
  }
}

@Injectable()
export class LogFactory {
  loggers: Map<string, Logger> = new Map();

  constructor(@Inject(LoggerConfig) private config: LoggerConfig) {}

  getDownLogger() {
    return this.create('down', this.getConfig('down'));
  }

  getUpLogger() {
    return this.create('up', this.getConfig('up'));
  }

  getConfig(type: 'up' | 'down') {
    return {
      successPath: `${this.config.folder}/${this.config[type].success}`,
      errorPath: `${this.config.folder}/${this.config[type].error}`,
    };
  }

  closeConnections() {
    [...this.loggers.values()].forEach((logger) => logger.close());
  }

  create(
    name: string,
    { successPath, errorPath }: { successPath: string; errorPath: string },
  ) {
    if (this.has(name)) {
      return this.get(name);
    }
    this.loggers.set(name, new Logger(successPath, errorPath));
    return this.get(name);
  }

  has(name: string) {
    return this.loggers.has(name);
  }

  get(name: string) {
    return this.loggers.get(name);
  }
}
