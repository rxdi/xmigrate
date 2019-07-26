"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = `
import { Db } from 'mongodb';

export async function up(db: Db) {
  await db
    .collection('albums')
    .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: true } });

  await db
    .collection('albums')
    .updateOne({ artist: 'The Doors' }, { $set: { stars: 5 } });
}

export async function down(db: Db) {
  await db
    .collection('albums')
    .updateOne({ artist: 'The Doors' }, { $set: { stars: 0 } });

  await db
    .collection('albums')
    .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: false } });
}
`;
