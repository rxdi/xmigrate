import { Injectable } from '@rxdi/core';
import { Config } from '../../injection.tokens';

@Injectable()
export class ConfigService {
  config: Config = {} as Config;

  constructor(private initConfig: Config) {}

  set(config: Config) {
    this.config = Object.assign(config, this.initConfig);
  }

  get() {
    return this.config;
  }
}
