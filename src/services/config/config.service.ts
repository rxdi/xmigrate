import { Injectable } from '@rxdi/core';
import { Config } from '../../injection.tokens';
import { DEFAULT_CONFIG } from '../../default.config';

@Injectable()
export class ConfigService {
  config: Config = DEFAULT_CONFIG;

  set(config: Config) {
    this.config = Object.assign(config, this.config);
  }

  get() {
    return this.config;
  }
}
