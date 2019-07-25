import { ReturnType, Tasks } from '../../injection.tokens';
import { LogFactory } from '../../helpers/log-factory';
import { MigrationService } from '../migration/migration.service';
import { ConfigService } from '../config/config.service';
export declare class GenericRunner {
    private logger;
    private configService;
    tasks: Map<string, Function>;
    constructor(logger: LogFactory, configService: ConfigService);
    setTasks(tasks: any[]): void;
    run(name: Tasks, args?: any): Promise<void>;
    fallback(fileName: string): Promise<ReturnType>;
    bind(self: MigrationService): this;
    logEnvironment(taskName: string): Promise<void>;
}
