export default `
module.exports = {
  async prepare (client) {
    return [client]
  },
  async up ([client]) {
    return ['Up']
  },

  async down ([client]) {
    return ['Down']
  }
}
`;
