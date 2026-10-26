const { postgresOptions, postgresTypes } = require('../postgresClient');
const DATABASE_URL = 'postgres://fixture:fixture@example.invalid/herbalism';

test('uses actual pg scalar parsers without changing global numeric/identifier handling', () => {
  const pg = require('pg');
  expect(pg.types.getTypeParser(1700, 'text')('60.0')).toBe('60.0');
  const types = postgresOptions({ DATABASE_URL }).knex.connection.types;
  const rate = types.getTypeParser(1700, 'text')('60.0');
  expect(rate).toBe(60);
  expect(rate.toFixed(1)).toBe('60.0');
  expect(types.getTypeParser(20, 'text')('7')).toBe(7);
  expect(types.getTypeParser(2950, 'text')('uuid-fixture')).toBe('uuid-fixture');
  expect(pg.types.getTypeParser(1700, 'text')('60.0')).toBe('60.0');
  expect(() => postgresTypes.getTypeParser(20)('9007199254740993')).toThrow(RangeError);
  expect(() => postgresTypes.getTypeParser(1700)('NaN')).toThrow(RangeError);
});

test('validates explicit PostgreSQL configuration without connecting', () => {
  const options = postgresOptions({ DATABASE_URL });
  expect(options.schema).toBe('public');
  expect(options.knex).toMatchObject({ client: 'pg', connection: { connectionString: DATABASE_URL, ssl: false }, pool: { min: 0, max: 10 } });
  expect(() => postgresOptions({})).toThrow('DATABASE_URL');
  expect(() => postgresOptions({ DATABASE_URL: 'not-a-url' })).toThrow('Invalid DATABASE_URL');
  expect(() => postgresOptions({ DATABASE_URL: 'https://example.invalid/game' })).toThrow();
  expect(() => postgresOptions({ DATABASE_URL: 'postgres://example.invalid/' })).toThrow();
});

test('uses certificate-verified TLS by default in production and rejects URL overrides', () => {
  expect(postgresOptions({ DATABASE_URL, NODE_ENV: 'production' }).knex.connection.ssl)
    .toEqual({ rejectUnauthorized: true });
  expect(() => postgresOptions({ DATABASE_URL: DATABASE_URL + '?sslmode=disable' })).toThrow('PG_SSL_MODE');
  expect(() => postgresOptions({ DATABASE_URL, PG_SSL_MODE: 'allow' })).toThrow();
  expect(postgresOptions({ DATABASE_URL, PG_SSL_MODE: 'disable' }).knex.connection.ssl).toBe(false);
});

test('validates pool and existing schema options', () => {
  expect(postgresOptions({ DATABASE_URL, PG_SCHEMA: 'herbalism', PG_POOL_MAX: '3' }))
    .toMatchObject({ schema: 'herbalism', knex: { pool: { max: 3 } } });
  for (const max of ['0', '31', '1.5', 'invalid']) {
    expect(() => postgresOptions({ DATABASE_URL, PG_POOL_MAX: max })).toThrow();
  }
  expect(() => postgresOptions({ DATABASE_URL, PG_SCHEMA: 'public;anything' })).toThrow();
});

test('initializes one shared lazy client and never runs a statement at construction', async () => {
  const oldEnv = process.env;
  process.env = { ...oldEnv, DATABASE_URL };
  jest.resetModules();
  const destroy = jest.fn();
  const knex = jest.fn(); knex.destroy = destroy;
  const factory = jest.fn(() => knex);
  jest.doMock('knex', () => factory);
  try {
    const { getPostgresClient } = require('../postgresClient');
    const first = getPostgresClient();
    expect(getPostgresClient()).toBe(first);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(knex).not.toHaveBeenCalled();
    await first.close();
    expect(destroy).toHaveBeenCalledTimes(1);
  } finally { process.env = oldEnv; jest.dontMock('knex'); jest.resetModules(); }
});
