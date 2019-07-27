/// <reference types="mongoose" />
import { MongoClient } from 'mongodb';
import { ConfigService } from '../config/config.service';
export declare class DatabaseService {
    private configService;
    connections: Map<string, MongoClient>;
    constructor(configService: ConfigService);
    connect(): Promise<MongoClient>;
    close(): Promise<void>;
    mongooseConnect(): Promise<typeof import("mongoose")>;
}
