import { MigrationSchema } from '../../injection.tokens';
import { ConfigService } from '../config/config.service';
export declare class MigrationsResolver {
    private configService;
    constructor(configService: ConfigService);
    getFileNames(): Promise<string[]>;
    readDir(): Promise<string[]>;
    getDistFileNames(): Promise<string[]>;
    isTypescript(file: string): boolean;
    loadMigration(fileName: string, cwd?: string): Promise<MigrationSchema>;
    getFilePath(fileName: string): string;
    getRelativePath(fileName: string): string;
    clean(migrations: string[]): Promise<boolean>;
    deleteArtefacts(fileName: string): Promise<void>;
    delete(path: string): Promise<unknown>;
    loadTsCompiledMigration(fileName: string): Promise<any>;
    transpileMigrations(migrations: string[]): Promise<void>;
    getTsCompiledFilePath(fileName: string): string;
    replaceFilenameJsWithTs(fileName: string): string;
}
