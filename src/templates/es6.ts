export default `
export async function prepare(client) {
  return [client]
}
export async function up([client]) {
  return ['Up'];
}
export async function down([client]) {
  return ['Down'];
}
`;
