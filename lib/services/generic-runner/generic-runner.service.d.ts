import { Tasks } from '../../injection.tokens';
import { LogFactory } from '../../helpers/log-factory';
import { MigrationService } from '../migration/migration.service';
import { ConfigService } from '../config/config.service';
import { MigrationsResolver } from '../migrations-resolver/migrations-resolver.service';
export declare class GenericRunner {
    private logger;
    private configService;
    private resolver;
    private migrationService;
    private tasks;
    constructor(logger: LogFactory, configService: ConfigService, resolver: MigrationsResolver, migrationService: MigrationService);
    setTasks(tasks: any[]): void;
    run(name: Tasks, args?: any): Promise<boolean>;
    private rollback;
    bind(self: MigrationService): this;
    private logEnvironment;
}
