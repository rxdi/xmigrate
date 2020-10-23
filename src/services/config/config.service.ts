import { Injectable } from '@rxdi/core';

import { DEFAULT_CONFIG } from '../../default.config';
import { Config } from '../../injection.tokens';

@Injectable()
export class ConfigService {
  config: Config = DEFAULT_CONFIG;

  set(config: Config) {
    Object.assign(this.config, config);
  }
}
