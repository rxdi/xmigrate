export default `
module.exports = {
  async up (db) {
    await db
      .collection('albums')
      .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: true } })
    await db
      .collection('albums')
      .updateOne({ artist: 'The Doors' }, { $set: { stars: 5 } })
  },

  async down (db) {
    await db
      .collection('albums')
      .updateOne({ artist: 'The Doors' }, { $set: { stars: 0 } })
    await db
      .collection('albums')
      .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: false } })
  }
}
`;
