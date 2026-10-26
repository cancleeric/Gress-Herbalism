const originalEnv = process.env;
beforeEach(() => { jest.resetModules(); process.env = { ...originalEnv }; delete process.env.DB_PROVIDER; });
afterEach(() => { process.env = originalEnv; jest.restoreAllMocks(); jest.dontMock('../postgresClient'); jest.dontMock('@supabase/supabase-js'); });

test('default stays Supabase even when a PostgreSQL URL exists', () => {
  const { getProvider } = require('../provider');
  expect(getProvider({ DATABASE_URL: 'postgres://example.invalid/game' })).toBe('supabase');
  expect(getProvider({ DB_PROVIDER: 'PostgreSQL' })).toBe('postgres');
  expect(() => getProvider({ DB_PROVIDER: 'typo' })).toThrow('DB_PROVIDER');
});

test('PostgreSQL primary and optional service clients share a pool without Supabase initialization', () => {
  process.env.DB_PROVIDER = 'postgres';
  delete process.env.SUPABASE_URL; delete process.env.SUPABASE_ANON_KEY; delete process.env.SUPABASE_SERVICE_KEY;
  const client = { from: jest.fn() };
  const getPostgresClient = jest.fn(() => client);
  jest.doMock('../postgresClient', () => ({ getPostgresClient }));
  jest.doMock('@supabase/supabase-js', () => { throw new Error('Supabase must not load in postgres mode'); });
  const { createDataClient } = require('../provider');
  expect(createDataClient()).toBe(client);
  expect(createDataClient({ serviceRole: true, optional: true })).toBe(client);
  expect(require('../supabase').supabase).toBe(client);
  expect(require('../../services/supabaseClient').getSupabase()).toBe(client);
  expect(require('../../services/supabaseClient').isSupabaseEnabled()).toBe(true);
});

test('Supabase missing settings still fail fast; optional service role remains optional', () => {
  delete process.env.SUPABASE_URL; delete process.env.SUPABASE_ANON_KEY;
  const { createDataClient } = require('../provider');
  expect(() => createDataClient()).toThrow('SUPABASE_URL');
  expect(createDataClient({ serviceRole: true, optional: true })).toBeNull();
  process.env.SUPABASE_URL = 'https://example.invalid';
  expect(() => createDataClient()).toThrow('SUPABASE_ANON_KEY');
});

test('Supabase paths retain distinct anon and service keys', () => {
  process.env.SUPABASE_URL = 'https://example.invalid';
  process.env.SUPABASE_ANON_KEY = 'anon-fixture';
  process.env.SUPABASE_SERVICE_KEY = 'service-fixture';
  const createClient = jest.fn(() => ({ from: jest.fn() }));
  jest.doMock('@supabase/supabase-js', () => ({ createClient }));
  const { createDataClient } = require('../provider');
  createDataClient(); createDataClient({ serviceRole: true });
  expect(createClient.mock.calls[0]).toEqual(['https://example.invalid', 'anon-fixture', undefined]);
  expect(createClient.mock.calls[1]).toEqual(['https://example.invalid', 'service-fixture',
    { auth: { autoRefreshToken: false, persistSession: false } }]);
});
