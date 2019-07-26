export default `
export async function up (db) {
  await db
    .collection('albums')
    .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: true } })
  await db
    .collection('albums')
    .updateOne({ artist: 'The Doors' }, { $set: { stars: 5 } })
},

export async function down (db) {
  await db
    .collection('albums')
    .updateOne({ artist: 'The Doors' }, { $set: { stars: 0 } })
  await db
    .collection('albums')
    .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: false } })
}
`;
