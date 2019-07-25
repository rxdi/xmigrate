import { ConnectionOptions } from 'mongoose';
import { ConfigService } from '../config/config.service';
export declare class DatabaseService {
    private configService;
    constructor(configService: ConfigService);
    connect(): Promise<import("mongodb").Db>;
    mongooseConnect(options?: ConnectionOptions): Promise<typeof import("mongoose")>;
}
