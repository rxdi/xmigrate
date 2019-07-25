import { MigrationSchema } from '../../injection.tokens';
import { ConfigService } from '../config/config.service';
export declare class MigrationsResolver {
    private configService;
    constructor(configService: ConfigService);
    getFileNames(): Promise<string[]>;
    loadMigration(fileName: string): MigrationSchema;
    resolve(): Promise<string>;
}
