export default `
import { MongoClient } from 'mongodb';

export async function up(client: MongoClient) {
  await client
    .db()
    .collection('albums')
    .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: true } });

  await client
    .db()
    .collection('albums')
    .updateOne({ artist: 'The Doors' }, { $set: { stars: 5 } });
}
export async function down(client: MongoClient) {
  await client
    .db()
    .collection('albums')
    .updateOne({ artist: 'The Doors' }, { $set: { stars: 0 } });

  await client
    .db()
    .collection('albums')
    .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: false } });
}

`;
