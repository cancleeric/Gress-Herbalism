const { candidate, rollbackCandidate } = require('../migrations/11483_persistent_replay');
const knexFactory = require('knex');

test('is inert and offline; no executable migration API is exported', () => {
  const module = require('../migrations/11483_persistent_replay');
  expect(Object.keys(module).sort()).toEqual(['candidate', 'rollbackCandidate']);
  expect(candidate().offlineOnly).toBe(true);
  expect(candidate().prerequisites.length).toBeGreaterThan(0);
  const a = candidate(); a.statements.length = 0;
  expect(candidate().statements.length).toBe(7);
});

test('compiles all candidate statements without opening a connection', async () => {
  const db = knexFactory({ client: 'pg', pool: { min: 0, max: 1 } });
  const acquire = jest.spyOn(db.client, 'acquireConnection').mockImplementation(() => {
    throw new Error('Offline verification must never connect');
  });
  try {
    for (const statement of candidate().statements) {
      const compiled = db.raw(statement).toSQL();
      expect(compiled.bindings).toEqual([]);
      expect(compiled.sql).toBe(statement);
    }
    expect(acquire).not.toHaveBeenCalled();
  } finally { await db.destroy(); }
});

test('candidate keeps legacy rows, uses distinct match identity and constrained event/view keys', () => {
  const sql = candidate().statements.join('\n');
  expect(sql).toContain('match_id UUID UNIQUE');
  expect(sql).toContain('PRIMARY KEY (game_history_id, seq)');
  expect(sql).toContain('event_id UUID NOT NULL UNIQUE');
  expect(sql).toContain('PRIMARY KEY (game_history_id, event_seq, viewer_seat)');
  expect(sql).toContain('REFERENCES herbalism.game_participants(game_history_id, seat_index)');
  expect(sql).not.toMatch(/DROP|TRUNCATE|DELETE FROM|GRANT|CREATE POLICY/i);
  expect(sql).not.toContain('auth.users');
});

test('rollback preserves recorded games rather than deleting history', () => {
  expect(rollbackCandidate()).toEqual({ mode: 'retain-data-disable-integration',
    statements: [], requiresFreshAuthorizationForDDL: true });
});

test('all replay relations target the dedicated schema, never public', () => {
  const sql = candidate().statements.join('\n');
  expect(sql).not.toContain('public.');
  expect(sql).toContain('ALTER TABLE herbalism.game_history');
});

test('initialization package contains exactly the reviewed replay contract and no public access grants', () => {
  const fs = require('fs');
  const path = require('path');
  const root = path.resolve(__dirname, '../../../docs/db-steps/herbalism-history-11496');
  const names = ['pre-check', 'snapshot-tables', 'migration', 'import-verify', 'data-check'];
  const files = Object.fromEntries(names.map(n => [n, fs.readFileSync(path.join(root, n + '.sql'), 'utf8')]));
  for (const text of Object.values(files)) {
    expect(text).toContain('herbalism_db');
    expect(text).not.toMatch(/CREATE POLICY|GRANT |ALTER ROLE|ALTER USER|DROP TABLE|TRUNCATE/i);
  }
  for (const statement of candidate().statements) expect(files.migration).toContain(statement);
  for (const name of ['players','game_history','game_participants','game_events','game_snapshots']) {
    expect(files.migration).toContain('CREATE TABLE herbalism.' + name);
    expect(files.migration).toContain('ALTER TABLE herbalism.' + name + ' ENABLE ROW LEVEL SECURITY');
  }
  expect(files.migration).toMatch(/BEGIN;/);
  expect(files.migration.trim()).toMatch(/COMMIT;$/);
  expect(files['import-verify'].trim()).toMatch(/ROLLBACK;$/);
  expect(files['import-verify']).not.toMatch(/COMMIT;/);
  expect(files['pre-check']).toContain("to_regnamespace('herbalism') IS NOT NULL");
});
