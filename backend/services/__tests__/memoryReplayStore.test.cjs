'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createMemoryReplayStore } = require('../memoryReplayStore');
const { createReplayRecorder } = require('../replayRecorder');
function frame(overrides = {}) {
  return { matchId: 'match', eventId: 'event-1', seq: 1, round: 1, at: 'now', startedAt: 'start',
    type: 'state', payload: {}, scores: { a: 5, b: 0 }, complete: false,
    seats: [{ seat: 0, id: 'a', uid: 'uid-a', name: '同名' }, { seat: 1, id: 'b', uid: 'uid-b', name: '同名' }],
    views: [{ seat: 0, state: { own: 'red', other: 'hidden' } }, { seat: 1, state: { own: 'green', other: 'hidden' } }], ...overrides };
}
test('history and snapshots are participant-only, own-view and immutable', async () => {
  const s = createMemoryReplayStore(), f = frame();
  await s.append(f); f.views[0].state.own = 'tampered';
  assert.deepEqual(await s.history('stranger'), []); assert.equal(await s.replay('stranger', 'match'), null);
  assert.equal(await s.replay(null, 'match'), null);
  const a = await s.replay('uid-a', 'match'); assert.equal(a.frames[0].state.own, 'red');
  assert.equal((await s.replay('uid-b', 'match')).frames[0].state.own, 'green');
  a.frames[0].state.own = 'changed'; assert.equal((await s.replay('uid-a', 'match')).frames[0].state.own, 'red');
  assert.doesNotMatch(JSON.stringify(await s.history('uid-a')), /uid-a|uid-b/);
});
test('retry is idempotent; conflicts, gaps and changed identities cannot modify a saved match', async () => {
  const s = createMemoryReplayStore(); await s.append(frame()); await s.append(frame());
  await assert.rejects(s.append(frame({ eventId: 'other' })), /conflict/);
  await assert.rejects(s.append(frame({ seq: 3 })), /gap/);
  const changed = frame({ seq: 2 }); changed.seats[0].uid = 'stranger';
  await assert.rejects(s.append(changed), /identity/);
  assert.equal((await s.replay('uid-a', 'match')).frames.length, 1);
});
test('100-frame pages, round/settlement and same-name winner use stable identity', async () => {
  const s = createMemoryReplayStore();
  for (let seq = 1; seq <= 101; seq++) await s.append(frame({ seq, eventId: `e${seq}`, round: 2,
    complete: seq === 101, winner: 'a' }));
  const first = await s.replay('uid-a', 'match'); assert.equal(first.next, 100); assert.equal(first.frames.length, 100);
  const last = await s.replay('uid-a', 'match', first.next); assert.equal(last.frames.length, 1); assert.equal(last.next, null);
  const [game] = await s.history('uid-a'); assert.equal(game.status, 'complete'); assert.equal(game.rounds, 2);
  assert.deepEqual(game.participants.map(p => p.is_winner), [true, false]);
  await assert.rejects(s.replay('uid-a', 'match', -1));
});
test('bounded retention evicts completed games, refuses to silently delete live games, restart is empty', async () => {
  const s = createMemoryReplayStore({ maxMatches: 1, maxFrames: 2 });
  await s.append(frame()); await assert.rejects(s.append(frame({ matchId: 'second' })), /capacity/);
  await s.append(frame({ seq: 2, eventId: 'e2', complete: true, winner: 'a' }));
  await s.append(frame({ matchId: 'second' })); assert.equal(await s.replay('uid-a', 'match'), null);
  await s.append(frame({ matchId: 'second', seq: 2, eventId: 'e2' }));
  await assert.rejects(s.append(frame({ matchId: 'second', seq: 3, eventId: 'e3' })), /capacity/);
  assert.equal((await s.history('uid-a'))[0].status, 'interrupted');
  assert.deepEqual(await createMemoryReplayStore().history('uid-a'), []);
  await assert.rejects(createMemoryReplayStore({ maxBytes: 1 }).append(frame()), /capacity/);
});
test('real recorder completes a match through the same store interface without exposing another hand', async () => {
  const s = createMemoryReplayStore(), r = createReplayRecorder(s);
  const state = { gameId: 'room', currentRound: 1, gamePhase: 'playing', scores: { a: 0, b: 0 }, hiddenCards: [{ color: 'blue' }],
    players: [{ id: 'a', firebaseUid: 'uid-a', name: '阿哲', hand: [{ color: 'red' }] },
      { id: 'b', firebaseUid: 'uid-b', name: '佳蓉', hand: [{ color: 'green' }] }] };
  r.start(state); r.capture(state); state.gamePhase = 'finished'; state.winner = 'a'; state.scores.a = 5;
  r.capture(state, 'guessResult', { hiddenCards: [{ color: 'blue' }], isCorrect: true }); await r.flush(state);
  const [h] = await s.history('uid-a'), replay = await s.replay('uid-a', h.matchId);
  assert.equal(h.status, 'complete'); assert.equal(replay.frames.length, 2);
  assert.deepEqual(replay.frames[0].state.players[1].hand, [{ hidden: true }]);
  assert.equal(replay.frames[1].payload.hiddenCards[0].color, 'blue');
});
