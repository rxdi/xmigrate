import { Config } from '../../injection.tokens';
export declare class ConfigService {
    private initConfig;
    config: Config;
    constructor(initConfig: Config);
    set(config: Config): void;
    get(): Config;
}
