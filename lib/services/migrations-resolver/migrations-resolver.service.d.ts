import { MigrationSchema } from '../../injection.tokens';
import { ConfigService } from '../config/config.service';
export declare class MigrationsResolver {
    private configService;
    defaultCompilationPath: string;
    constructor(configService: ConfigService);
    getFileNames(): Promise<string[]>;
    isTypescript(file: string): boolean;
    loadMigration(fileName: string): Promise<MigrationSchema>;
    getFilePath(fileName: string): string;
    getRelativePath(fileName: string): string;
    clean(migrations: string[]): Promise<boolean>;
    deleteArtefacts(fileName: string): Promise<void>;
    delete(fileName: string): Promise<unknown>;
    loadTsMigration(fileName: string): Promise<any>;
    transpileMigrations(migrations: string[]): Promise<void>;
    getTsFilePath(fileName: string): string;
    replaceFilenameJsWithTs(fileName: string): string;
    resolve(): Promise<string>;
}
