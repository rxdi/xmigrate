import { Tasks } from '../../injection.tokens';
import { LogFactory } from '../../helpers/log-factory';
import { MigrationService } from '../migration/migration.service';
import { ConfigService } from '../config/config.service';
export declare class GenericRunner {
    private logger;
    private configService;
    private tasks;
    constructor(logger: LogFactory, configService: ConfigService);
    setTasks(tasks: any[]): void;
    run(name: Tasks, args?: any): Promise<void>;
    private fallback;
    bind(self: MigrationService): this;
    private logEnvironment;
}
