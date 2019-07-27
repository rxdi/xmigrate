import { Injectable } from '@rxdi/core';
import { Config } from '../../injection.tokens';
import { DEFAULT_CONFIG } from '../../default.config';
import { promisify } from 'util';
import { exists } from 'fs';
import { join } from 'path';
import { TranspileTypescript } from '../../helpers/typescript-builder';

@Injectable()
export class ConfigService {
  config: Config = DEFAULT_CONFIG;

  set(config: Config) {
    Object.assign(this.config, config);
  }

  get() {
    return this.config;
  }

  async getTypescriptSettings(configDist: string, fileName: string) {
    if (!(await promisify(exists)(`./${configDist}/${fileName}.js`))) {
      await TranspileTypescript([`/${fileName}.ts`], configDist);
    }
    return require('esm')(module)(
      join(process.cwd(), `./${configDist}`, `${fileName}.js`)
    );
  }

  getES6(fileName: string) {
    return require('esm')(module)(`./${fileName}.js`);
  }
}
