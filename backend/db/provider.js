// Provider selection is explicit: a DATABASE_URL alone never changes backends.
function getProvider(env = process.env) {
  const provider = (env.DB_PROVIDER || 'supabase').trim().toLowerCase();
  if (provider === 'postgres' || provider === 'postgresql') return 'postgres';
  if (provider === 'supabase') return provider;
  throw new Error('DB_PROVIDER must be supabase or postgres');
}

function createDataClient({ serviceRole = false, optional = false } = {}) {
  if (getProvider() === 'postgres') {
    return require('./postgresClient').getPostgresClient();
  }
  const keyName = serviceRole ? 'SUPABASE_SERVICE_KEY' : 'SUPABASE_ANON_KEY';
  for (const name of ['SUPABASE_URL', keyName]) {
    if (!process.env[name]) {
      if (optional) return null;
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }
  return require('@supabase/supabase-js').createClient(
    process.env.SUPABASE_URL, process.env[keyName],
    serviceRole ? { auth: { autoRefreshToken: false, persistSession: false } } : undefined
  );
}

module.exports = { getProvider, createDataClient };
