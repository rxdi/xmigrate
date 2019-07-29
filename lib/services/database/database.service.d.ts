import { MongoClient } from 'mongodb';
import { connect, Mongoose } from 'mongoose';
import { ConfigService } from '../config/config.service';
export declare class DatabaseService {
    private configService;
    connections: Map<string, MongoClient>;
    connectionsMongoose: Map<string, Mongoose>;
    constructor(configService: ConfigService);
    connect(): Promise<MongoClient>;
    getMongoClient(): typeof MongoClient;
    close(): Promise<void>;
    closeMongoose(): Promise<void>;
    setConnections(url: string, client: MongoClient): void;
    setConnectionsMongoose(url: string, client: Mongoose): void;
    connectMongoose(): typeof connect;
    mongooseConnect(): Promise<typeof import("mongoose")>;
}
