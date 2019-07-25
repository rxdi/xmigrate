import { MigrationSchema } from '../../injection.tokens';
import { ConfigService } from '../config/config.service';
export declare class MigrationsResolver {
    private configService;
    constructor(configService: ConfigService);
    getFileNames(): Promise<string[]>;
    isTypescript(file: string): boolean;
    loadMigration(fileName: string): Promise<MigrationSchema>;
    getFilePath(fileName: string): string;
    getRelativePath(fileName: string): string;
    loadTsMigration(fileName: string): Promise<any>;
    resolve(): Promise<string>;
}
