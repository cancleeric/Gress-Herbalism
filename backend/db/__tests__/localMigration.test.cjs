'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { options, migrate } = require('../../scripts/migrate-local.cjs');
const initial = require('../local-migrations/001-initialize.cjs');
const env = { HERBALISM_ENV: 'local-docker', PG_SCHEMA: 'herbalism',
  DATABASE_URL: 'postgres://herbalism_owner:fixture-only@db:5432/herbalism_db' };
test('fixed target and .cjs history configuration', () => {
  assert.equal(options(env).migrations.tableName, 'herbalism_local_migrations');
  for (const url of ['postgres://x:y@prod/herbalism_db', 'postgres://herbalism_owner:x@db/other',
    'postgres://herbalism_owner:x@db/herbalism_db?sslmode=require']) {
    assert.throws(() => options({ ...env, DATABASE_URL: url }));
  }
  assert.throws(() => options({ ...env, HERBALISM_ENV: 'prod' }));
});
test('migrate latest executes every time and client closes on success/no-op/failure', async () => {
  for (const mode of ['applied', 'noop', 'failed', 'wrong-target']) {
    let latest = 0, closed = 0;
    const db = { raw: async () => ({ rows: [{ database: mode === 'wrong-target' ? 'other' : 'herbalism_db',
      executor: 'herbalism_owner', version: 150000 }] }),
    migrate: { latest: async () => { latest++; if (mode === 'failed') throw new Error('fixture'); return [1, mode === 'noop' ? [] : ['001']]; } },
    destroy: async () => { closed++; } };
    if (['failed', 'wrong-target'].includes(mode)) await assert.rejects(migrate(env, () => db));
    else assert.equal((await migrate(env, () => db)).applied, mode === 'noop' ? 0 : 1);
    assert.equal(latest, mode === 'wrong-target' ? 0 : 1);
    assert.equal(closed, 1);
  }
});
test('one initializer wraps base and replay once, no nested transaction or destructive down', async () => {
  const statements = [];
  await initial.up({ raw: async sql => { statements.push(sql); return { rows: [{ database: 'herbalism_db', version: 150000, existing: null }] }; } });
  const sql = statements.join('\n');
  for (const name of ['players', 'game_history', 'game_participants', 'game_events', 'game_snapshots']) {
    assert.equal((sql.match(new RegExp('CREATE TABLE herbalism\\.' + name + ' \\(', 'g')) || []).length, 1);
  }
  assert.doesNotMatch(sql, /\b(BEGIN|COMMIT|GRANT|CREATE ROLE|DROP TABLE)\b/);
  await assert.rejects(initial.down());
  assert.equal(initial.config.transaction, true);
});
test('existing schema or wrong PG aborts before any DDL', async () => {
  for (const row of [{ database: 'herbalism_db', version: 150000, existing: 'herbalism' },
    { database: 'herbalism_db', version: 160000, existing: null }]) {
    let calls = 0;
    await assert.rejects(initial.up({ raw: async () => { calls++; return { rows: [row] }; } }));
    assert.equal(calls, 1);
  }
});
