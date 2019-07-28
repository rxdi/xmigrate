import { DatabaseService } from '../database/database.service';
import { ReturnType } from '../../injection.tokens';
import { TemplateTypes } from '../../templates/index';
import { MigrationsResolver } from '../migrations-resolver/migrations-resolver.service';
import { LogFactory } from '../../helpers/log-factory';
import { ConfigService } from '../config/config.service';
export declare class MigrationService {
    private configService;
    private database;
    private migrationsResolver;
    private logger;
    constructor(configService: ConfigService, database: DatabaseService, migrationsResolver: MigrationsResolver, logger: LogFactory);
    connect(): Promise<import("mongodb").MongoClient>;
    up(): Promise<ReturnType[]>;
    down(): Promise<ReturnType[]>;
    createWithTemplate(template: TemplateTypes, name: string, config?: {
        raw: boolean;
        typescript?: boolean;
    }): Promise<string>;
    private writeConfig;
    init(): Promise<void>;
    create({ name, template }: {
        name: string;
        template: TemplateTypes;
    }): Promise<void>;
    statusInternal(): Promise<ReturnType[]>;
    status(): Promise<{
        status: boolean;
        result: ReturnType[];
    }>;
    printStatus(status: ReturnType[], type?: 'table'): void;
}
