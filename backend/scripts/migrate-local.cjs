'use strict';
const path = require('node:path');

function options(env) {
  let url;
  try { url = new URL(env.DATABASE_URL); } catch { throw new Error('Local owner DATABASE_URL required'); }
  if (env.HERBALISM_ENV !== 'local-docker' || env.PG_SCHEMA !== 'herbalism' ||
      !['postgres:', 'postgresql:'].includes(url.protocol) || url.hostname !== 'db' ||
      (url.port && url.port !== '5432') || url.pathname !== '/herbalism_db' ||
      url.username !== 'herbalism_owner' || !url.password || url.search || url.hash) {
    throw new Error('Migration is restricted to the dedicated local Docker target');
  }
  return {
    client: 'pg', connection: { connectionString: env.DATABASE_URL, ssl: false,
      connectionTimeoutMillis: 5000, statement_timeout: 60000 },
    pool: { min: 0, max: 1 }, acquireConnectionTimeout: 10000,
    migrations: { directory: path.resolve(__dirname, '../db/local-migrations'),
      loadExtensions: ['.cjs'], tableName: 'herbalism_local_migrations', schemaName: 'public' },
  };
}
async function migrate(env, createClient) {
  const db = createClient(options(env));
  try {
    const target = await db.raw("SELECT current_database() AS database, current_user AS executor, current_setting('server_version_num')::integer AS version");
    const row = target.rows[0];
    if (row.database !== 'herbalism_db' || row.executor !== 'herbalism_owner' || row.version < 150000 || row.version >= 160000) {
      throw new Error('Connected migration target does not match the local contract');
    }
    // Knex owns persistent history, transactional execution and migration locking.
    const [batch, files] = await db.migrate.latest();
    return { batch, applied: files.length };
  } finally { await db.destroy(); }
}
if (require.main === module) {
  migrate(process.env, require('knex')).then(result => console.log(JSON.stringify(result)))
    .catch(() => { console.error('Local migration failed; application deployment must stop.'); process.exitCode = 1; });
}
module.exports = { options, migrate };
