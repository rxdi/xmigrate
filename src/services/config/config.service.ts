import { Injectable } from '@rxdi/core';
import { Config } from '../../injection.tokens';
import { DEFAULT_CONFIG } from '../../default.config';

@Injectable()
export class ConfigService {
  config: Config = DEFAULT_CONFIG;

  constructor(private initConfig: Config) {}

  set(config: Config) {
    this.config = Object.assign(config, this.initConfig);
  }

  get() {
    return this.config;
  }
}
