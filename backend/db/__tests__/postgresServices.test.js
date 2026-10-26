const knexFactory = require('knex');

// End-to-end service -> adapter -> real pg query compiler -> recorded fixtures.
// The injected runner is the only execution boundary; it never opens a connection.
let db;
let run;
let records;
let friends;
let invitations;
let presence;
beforeEach(() => {
  jest.resetModules();
  const { createPostgresAdapter } = require('../postgresQuery');
  const knex = knexFactory({ client: 'pg', pool: { min: 0, max: 1 } });
  run = jest.fn().mockResolvedValue([]);
  db = createPostgresAdapter(knex, { run });
  jest.doMock('../provider', () => ({ createDataClient: () => db }));
  records = require('../supabase');
  friends = require('../../services/friendService');
  invitations = require('../../services/invitationService');
  presence = require('../../services/presenceService');
});
afterEach(async () => { await db.close(); jest.dontMock('../provider'); });

test('new player is returned after missing-lookup then insert', async () => {
  run.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'p', display_name: 'Player', firebase_uid: 'uid' }]);
  expect(await records.getOrCreatePlayer('Player', 'uid')).toMatchObject({ id: 'p', firebase_uid: 'uid' });
  expect(run.mock.calls.map(([q]) => q.toSQL().method)).toEqual(['select', 'insert']);
  expect(run.mock.calls[0][0].toSQL().bindings).toEqual(['uid']);
});

test('existing player lookup does not insert or overwrite a record', async () => {
  run.mockResolvedValueOnce([{ id: 'p', display_name: 'Existing' }]);
  expect(await records.getOrCreatePlayer('New', 'uid')).toMatchObject({ display_name: 'Existing' });
  expect(run).toHaveBeenCalledTimes(1);
});

test('game results preserve public record and participant contracts', async () => {
  run.mockResolvedValueOnce([{ id: 11 }]);
  expect(await records.saveGameRecord({ gameId: 'g', winnerName: 'Winner', playerCount: 3, roundsPlayed: 2 })).toBe(11);
  await records.saveGameParticipants(11, [{ name: 'Winner', score: 7, isWinner: true, playerId: 'p' }]);
  expect(run.mock.calls[1][0].toSQL().bindings).toContain('p');
  expect(run.mock.calls[1][0].toSQL().bindings).toContain(11);
});

test('leaderboard and history preserve API response shapes', async () => {
  run.mockResolvedValueOnce([{ id: 'p', total_score: 10 }]);
  expect(await records.getLeaderboard('total_score', 10)).toEqual([{ rank: 1, id: 'p', total_score: 10 }]);
  run.mockResolvedValueOnce([{ final_score: 7, game_history_id: 11 }])
    .mockResolvedValueOnce([{ id: 11, game_id: 'g', player_count: 3, rounds_played: 2, winner_name: 'Winner' }]);
  expect(await records.getPlayerHistory('p')).toEqual([{ final_score: 7,
    game_history: { game_id: 'g', player_count: 3, rounds_played: 2, winner_name: 'Winner' } }]);
});

test('friend search keeps anonymous/friend/request exclusions and binds display names', async () => {
  run.mockResolvedValueOnce([{ friend_id: 'friend' }]).mockResolvedValueOnce([{ to_user_id: 'pending' }])
    .mockResolvedValueOnce([{ id: 'new', display_name: 'Alice' }]);
  expect(await friends.searchPlayers('Ali', 'me')).toEqual([{ id: 'new', display_name: 'Alice' }]);
  const compiled = run.mock.calls[2][0].toSQL();
  expect(compiled.bindings).toEqual(['me', 'friend', 'pending', '%Ali%', 20]);
  expect(compiled.sql).toContain('is not null');
});

test('friend list combines profile and presence without changing field names', async () => {
  run.mockResolvedValueOnce([{ id: 1, friend_id: 'friend', created_at: 'time' }])
    .mockResolvedValueOnce([{ id: 'friend', display_name: 'Other' }])
    .mockResolvedValueOnce([{ user_id: 'friend', status: 'online', current_room_id: null }]);
  expect(await friends.getFriends('me')).toEqual([{ id: 1, created_at: 'time', friend: {
    id: 'friend', display_name: 'Other', presence: { user_id: 'friend', status: 'online', current_room_id: null },
  } }]);
});

test('invitation response preserves recipient and pending-status boundaries', async () => {
  run.mockResolvedValueOnce([{ room_id: 'room' }]);
  expect(await invitations.respondToInvitation(3, 'recipient', 'accept')).toEqual({ room_id: 'room' });
  expect(run.mock.calls[0][0].toSQL().bindings).toEqual(['accepted', 3, 'recipient', 'pending']);
});

test('friend request count and presence use the adapter contract', async () => {
  run.mockResolvedValueOnce([{ count: '2' }]);
  expect(await friends.getFriendRequestCount('me')).toBe(2);
  await presence.setInGame('me', 'room');
  expect(run.mock.calls[1][0].toSQL().bindings).toEqual(['room', expect.any(String), 'in_game', 'me']);
});

test('read-only readiness rejects a missing-table error instead of reporting success', async () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    run.mockRejectedValueOnce(Object.assign(new Error('fixture error'), { code: '42P01' }));
    expect(await records.testConnection()).toBe(false);
    run.mockResolvedValueOnce([]);
    const info = jest.spyOn(console, 'log').mockImplementation(() => {});
    expect(await records.testConnection()).toBe(true);
    info.mockRestore();
  } finally { log.mockRestore(); }
});
