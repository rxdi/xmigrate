import { Config } from '../../injection.tokens';
export declare class ConfigService {
    config: Config;
    set(config: Config): void;
    get(): Config;
    getTypescriptSettings(configDist: string, fileName: string): Promise<any>;
    getES6(fileName: string): any;
}
