const { createPostgresAdapter } = require('./postgresQuery');
const pgTypes = require('pg').types;

// Per-client parsers, not global pg defaults. Preserve the existing JSON API's
// numeric types, including NUMERIC win_rate fields consumed with toFixed().
const postgresTypes = {
  getTypeParser(oid, format = 'text') {
    if (format === 'text' && (Number(oid) === 1700 || Number(oid) === 20)) {
      return value => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || (Number(oid) === 20 && !Number.isSafeInteger(parsed))) {
          throw new RangeError('Database number cannot be represented safely by the JSON API');
        }
        return parsed;
      };
    }
    return pgTypes.getTypeParser(oid, format);
  },
};

function postgresOptions(env = process.env) {
  if (!env.DATABASE_URL) throw new Error('Missing required environment variable: DATABASE_URL');
  let url;
  try { url = new URL(env.DATABASE_URL); } catch (_) { throw new Error('Invalid DATABASE_URL'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || url.pathname.length < 2) {
    throw new Error('DATABASE_URL must identify a PostgreSQL host and database');
  }
  // Avoid libpq URL flags silently overriding the explicit TLS policy below.
  if ([...url.searchParams.keys()].some(key => key.toLowerCase().startsWith('ssl'))) {
    throw new Error('Configure TLS with PG_SSL_MODE, not DATABASE_URL query parameters');
  }
  const sslMode = env.PG_SSL_MODE || (env.NODE_ENV === 'production' ? 'verify-full' : 'disable');
  if (!['disable', 'verify-full'].includes(sslMode)) {
    throw new Error('PG_SSL_MODE must be disable or verify-full');
  }
  const schema = env.PG_SCHEMA || 'herbalism';
  if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error('Invalid PG_SCHEMA');
  const max = Number(env.PG_POOL_MAX || 10);
  if (!Number.isInteger(max) || max < 1 || max > 30) throw new Error('PG_POOL_MAX must be 1–30');
  return {
    schema,
    knex: {
      client: 'pg',
      connection: {
        connectionString: env.DATABASE_URL,
        ssl: sslMode === 'verify-full' ? { rejectUnauthorized: true } : false,
        application_name: 'herbalism',
        types: postgresTypes,
        connectionTimeoutMillis: 5000,
        statement_timeout: 15000,
      },
      pool: { min: 0, max },
      acquireConnectionTimeout: 10000,
    },
  };
}

let client;
function getPostgresClient() {
  if (!client) {
    const options = postgresOptions();
    const knex = require('knex')(options.knex);
    client = createPostgresAdapter(knex, { schema: options.schema });
  }
  return client;
}

module.exports = { postgresOptions, getPostgresClient, postgresTypes };
