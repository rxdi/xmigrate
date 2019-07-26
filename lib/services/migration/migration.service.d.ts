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
    down(): Promise<unknown>;
    createWithTemplate(template: TemplateTypes, name: string): Promise<string>;
    init(): Promise<void>;
    create({ name, template }: {
        name: any;
        template: any;
    }): Promise<void>;
    private statusInternal;
    status(): Promise<{
        status: boolean;
        result: ReturnType[];
    }>;
    printStatus(status: ReturnType[], type?: 'table'): void;
}
