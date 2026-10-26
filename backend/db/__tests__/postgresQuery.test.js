const knexFactory = require('knex');
const { createPostgresAdapter } = require('../postgresQuery');

// Compilation + recorded-result tests only. No database connection/DDL/engine.
let knex;
let run;
let db;
beforeEach(() => {
  knex = knexFactory({ client: 'pg', pool: { min: 0, max: 1 } });
  run = jest.fn().mockResolvedValue([]);
  db = createPostgresAdapter(knex, { run });
});
afterEach(async () => { await db.close(); });

test('binds search text rather than interpolating it', async () => {
  const text = "%O'Reilly; malicious-text%";
  await db.from('players').select('id,display_name').ilike('display_name', text).limit(20);
  const compiled = run.mock.calls[0][0].toSQL();
  expect(compiled.bindings).toEqual([text, 20]);
  expect(compiled.sql).not.toContain(text);
  expect(compiled.sql).toContain('"public"."players"');
});

test('compiles comparison, null, exclusion and ordering filters together', async () => {
  await db.from('players').select('id').gt('games_played', 0)
    .not('firebase_uid', 'is', null).not('id', 'in', '(one,two)')
    .order('total_score', { ascending: false }).limit(10);
  const compiled = run.mock.calls[0][0].toSQL();
  expect(compiled.bindings).toEqual([0, 'one', 'two', 10]);
  expect(compiled.sql).toContain('is not null');
  expect(compiled.sql).toContain('desc');
});

test('preserves bilateral friendship OR grouping and binds IDs', async () => {
  await db.from('friendships').select('id')
    .or('and(user_id.eq.alice,friend_id.eq.bob),and(user_id.eq.bob,friend_id.eq.alice)')
    .eq('status', 'accepted');
  const compiled = run.mock.calls[0][0].toSQL();
  expect(compiled.bindings).toEqual(['alice', 'bob', 'bob', 'alice', 'accepted']);
  expect(compiled.sql).toContain(' or ');
});

test('empty IN matches no rows and supports standalone equality OR', async () => {
  await db.from('players').select('id').in('id', []);
  expect(run.mock.calls[0][0].toSQL().bindings).toEqual([0]);
  await db.from('friend_requests').select('id').or('from_user_id.eq.a,to_user_id.eq.a');
  expect(run.mock.calls[1][0].toSQL().bindings).toEqual(['a', 'a']);
});

test.each(['players;anything', 'pg_authid', 'other.players'])(
  'rejects unsupported tables: %s', table => expect(() => db.from(table)).toThrow()
);
test.each(['id desc', 'id;anything', 'other.id', '*'])('rejects expression identifiers: %s', column => {
  expect(() => db.from('players').order(column)).toThrow();
});
test.each(['id.gt.1', 'id.eq.a)', 'and(and(id.eq.a))', '', 'id.eq.a,']) (
  'rejects unsupported or malformed filter expressions: %s', expression => {
    expect(() => db.from('players').or(expression)).toThrow();
  }
);
test('rejects unsupported select and filter shapes without running a query', () => {
  expect(() => db.from('players').select('arbitrary(*)')).toThrow();
  expect(() => db.from('players').select('id', { count: 'estimated' })).toThrow();
  expect(() => db.from('players').eq('id', null)).toThrow();
  expect(() => db.from('players').in('id', 'one')).toThrow();
  expect(() => db.from('players').not('id', 'eq', 'one')).toThrow();
  expect(() => db.from('players').ilike('display_name', 10)).toThrow();
  expect(() => db.from('players').limit(-1)).toThrow();
  expect(() => db.from('players').limit(1.5)).toThrow();
  expect(() => db.from('players').limit(1001)).toThrow();
  expect(run).not.toHaveBeenCalled();
});

test('preserves single / maybeSingle result and cardinality error contracts', async () => {
  run.mockResolvedValueOnce([{ id: 'one' }]);
  expect(await db.from('players').select('id').eq('id', 'one').single())
    .toMatchObject({ data: { id: 'one' }, error: null });
  expect(await db.from('players').select('id').maybeSingle()).toMatchObject({ data: null, error: null });
  expect(await db.from('players').select('id').single()).toMatchObject({ error: { code: 'PGRST116' } });
  run.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
  expect(await db.from('players').select('id').maybeSingle()).toMatchObject({ error: { code: 'PGRST116' } });
});

test('exact head count applies filters without a second data query', async () => {
  run.mockResolvedValueOnce([{ count: '7' }]);
  expect(await db.from('friend_requests').select('id', { count: 'exact', head: true })
    .eq('to_user_id', 'me').eq('status', 'pending'))
    .toEqual({ data: null, error: null, count: 7 });
  expect(run).toHaveBeenCalledTimes(1);
  expect(run.mock.calls[0][0].toSQL().bindings).toEqual(['me', 'pending']);
});

test('exact non-head count returns unpaged count with limited data', async () => {
  run.mockResolvedValueOnce([{ count: '3' }]).mockResolvedValueOnce([{ id: 1 }]);
  expect(await db.from('players').select('id', { count: 'exact' }).limit(1))
    .toEqual({ data: [{ id: 1 }], error: null, count: 3 });
  expect(run).toHaveBeenCalledTimes(2);
});

test('insert returning selects requested fields and executes once when awaited twice', async () => {
  run.mockResolvedValue([{ id: 12 }]);
  const query = db.from('game_history').insert({ game_id: 'game-one', player_count: 3 }).select('id').single();
  expect((await query).data).toEqual({ id: 12 });
  expect((await query).data).toEqual({ id: 12 });
  expect(run).toHaveBeenCalledTimes(1);
  expect(run.mock.calls[0][0].toSQL()).toMatchObject({ method: 'insert', returning: ['id'] });
});

test('batch insert without select returns no data', async () => {
  expect(await db.from('game_participants').insert([
    { game_history_id: 12, player_name: 'one' }, { game_history_id: 12, player_name: 'two' },
  ])).toEqual({ data: null, error: null, count: null });
  expect(run.mock.calls[0][0].toSQL().bindings).toEqual([12, 'one', 12, 'two']);
});

test('updates invitations with all ownership/status filters and returns room ID', async () => {
  run.mockResolvedValue([{ room_id: 'room-one' }]);
  const result = await db.from('game_invitations').update({ status: 'accepted' })
    .eq('id', 4).eq('to_user_id', 'me').eq('status', 'pending').select('room_id').single();
  expect(result.data).toEqual({ room_id: 'room-one' });
  expect(run.mock.calls[0][0].toSQL().bindings).toEqual(['accepted', 4, 'me', 'pending']);
});

test('deletes only filtered bilateral friendships', async () => {
  await db.from('friendships').delete()
    .or('and(user_id.eq.a,friend_id.eq.b),and(user_id.eq.b,friend_id.eq.a)');
  expect(run.mock.calls[0][0].toSQL()).toMatchObject({ method: 'del', bindings: ['a', 'b', 'b', 'a'] });
});

test('rejects unfiltered writes and unsupported conflict targets', async () => {
  expect((await db.from('players').update({ display_name: 'no' })).error).not.toBeNull();
  expect((await db.from('friendships').delete()).error).not.toBeNull();
  expect(() => db.from('players').upsert({ id: 'one' })).toThrow();
  expect(() => db.from('players').insert([])).toThrow();
  expect(() => db.from('players').update([{ id: 'one' }])).toThrow();
  expect(run).not.toHaveBeenCalled();
});

test('presence and replay upserts use explicit domain conflict keys', async () => {
  await db.from('user_presence').upsert({ user_id: 'one', status: 'online' });
  expect(run.mock.calls[0][0].toSQL().sql).toContain('on conflict ("user_id")');
  await db.from('evolution_game_replays').upsert({ game_id: 'g', events: [{ type: 'start' }] });
  const compiled = run.mock.calls[1][0].toSQL();
  expect(compiled.sql).toContain('on conflict ("game_id")');
  expect(compiled.bindings).toContain('[{"type":"start"}]');
});

test('encodes JSON fields and preserves them in returned records', async () => {
  run.mockResolvedValue([{ id: 'g', config: { rounds: 2 } }]);
  const result = await db.from('evolution_games').insert({ id: 'g', config: { rounds: 2 } }).select().single();
  expect(run.mock.calls[0][0].toSQL().bindings).toContain('{"rounds":2}');
  expect(result.data.config).toEqual({ rounds: 2 });
});

test('hydrates game history via one batch query without leaking internal join keys', async () => {
  run.mockResolvedValueOnce([{ final_score: 4, game_history_id: 12 }])
    .mockResolvedValueOnce([{ id: 12, game_id: 'game-one', player_count: 3 }]);
  const result = await db.from('game_participants')
    .select('final_score, game_history(game_id,player_count)').eq('player_id', 'me');
  expect(result.data).toEqual([{ final_score: 4, game_history: { game_id: 'game-one', player_count: 3 } }]);
  expect(run).toHaveBeenCalledTimes(2);
  expect(run.mock.calls[1][0].toSQL().bindings).toEqual([12]);
});

test('hydrates evolution alias and returns null for absent relations', async () => {
  run.mockResolvedValueOnce([{ id: 'p', game_id: 'g' }, { id: 'p2', game_id: null }])
    .mockResolvedValueOnce([{ id: 'g', status: 'playing' }]);
  const result = await db.from('evolution_participants').select('*,game:evolution_games(*)');
  expect(result.data).toEqual([
    { id: 'p', game_id: 'g', game: { id: 'g', status: 'playing' } },
    { id: 'p2', game_id: null, game: null },
  ]);
});

test('normalizes pg timestamps and keeps empty related sets empty', async () => {
  run.mockResolvedValueOnce([{ created_at: new Date('2026-10-25T00:00:00Z'), game_history_id: null }]);
  const result = await db.from('game_participants').select('created_at,game_history(game_id)');
  expect(result.data).toEqual([{ created_at: '2026-10-25T00:00:00.000Z', game_history: null }]);
  expect(run).toHaveBeenCalledTimes(1);
});

test('redacts query/connection values from errors but preserves safe error codes', async () => {
  run.mockRejectedValueOnce(Object.assign(new Error('sensitive-query-and-value'), { code: '23505' }));
  const result = await db.from('players').select('*');
  expect(result).toEqual({ data: null, error: { code: '23505', message: 'Database operation failed' }, count: null });
  run.mockRejectedValueOnce(Object.assign(new Error('sensitive-host'), { code: 'ECONNREFUSED' }));
  expect((await db.from('players').select('*')).error.code).toBe('DB_ERROR');
});

test('allows a separately configured existing schema', () => {
  const other = createPostgresAdapter(knex, { schema: 'herbalism', run });
  expect(other.from('players').select('id').build().toSQL().sql).toContain('"herbalism"."players"');
  expect(() => createPostgresAdapter(knex, { schema: 'unsafe-name' })).toThrow();
});
