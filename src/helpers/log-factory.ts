import { Inject, Injectable } from '@rxdi/core';
import { LoggerConfig } from '../injection.tokens';

import { createWriteStream, WriteStream } from 'fs';

export class Logger {
  successLogger: WriteStream;
  errorLogger: WriteStream;
  constructor(successPath: string, errorPath: string) {
    this.successLogger = createWriteStream(successPath, {
      flags: 'a'
    });
    this.errorLogger = createWriteStream(errorPath, {
      flags: 'a'
    });
  }
  log(res: unknown) {
    this.successLogger.write(this.getLogTemplate(res, '🚀'));
  }
  error(res: unknown) {
    this.errorLogger.write(this.getLogTemplate(res, '🔥'));
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
      errorPath: `${this.config.folder}/${this.config[type].error}`
    };
  }

  closeConnections() {
    [...this.loggers.values()].forEach(logger => logger.close());
  }

  create(
    name: string,
    { successPath, errorPath }: { successPath: string; errorPath: string }
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
