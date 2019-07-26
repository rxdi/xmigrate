/// <reference types="mongoose" />
import { MongoClient } from 'mongodb';
import { ConfigService } from '../config/config.service';
export declare class DatabaseService {
    private configService;
    constructor(configService: ConfigService);
    connect(): Promise<MongoClient>;
    mongooseConnect(): Promise<typeof import("mongoose")>;
}
