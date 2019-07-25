/// <reference types="mongoose" />
import { ConfigService } from '../config/config.service';
export declare class DatabaseService {
    private configService;
    constructor(configService: ConfigService);
    connect(): Promise<import("mongodb").Db>;
    mongooseConnect(): Promise<typeof import("mongoose")>;
}
