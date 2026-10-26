jest.mock('../logic/evolution/gameLogic', () => ({ initGame: jest.fn(), startGame: jest.fn(), processAction: jest.fn() }));
const gameLogic = require('../logic/evolution/gameLogic');
const handler = require('../evolutionGameHandler');
const makeSocket = (id, uid) => ({ id, uid, emit: jest.fn(), join: jest.fn(), leave: jest.fn(), to: jest.fn(() => ({ emit: jest.fn() })) });
let io, host, guest, room;
beforeEach(() => {
 jest.clearAllMocks(); handler._evoRooms.clear(); handler._evoPlayerSockets.clear();
 io = { emit: jest.fn(), to: jest.fn(() => ({ emit: jest.fn() })) };
 host = makeSocket('host-socket', 'host-uid'); guest = makeSocket('guest-socket', 'guest-uid');
 handler.createRoom(host, io, { player: { id: 'host', name: 'Host' } }); room = [...handler._evoRooms.values()][0];
 handler.joinRoom(guest, io, { roomId: room.id, player: { id: 'guest', name: 'Guest' } });
 room.gameState = { players: { host: { id: 'host', hand: ['HOST_PRIVATE'], creatures: [] }, guest: { id: 'guest', hand: ['GUEST_PRIVATE'], creatures: [] } }, deck: ['DECK_PRIVATE'] };
 gameLogic.processAction.mockReturnValue({ success: true, gameState: room.gameState, events: [] });
 gameLogic.initGame.mockReturnValue({ success: true, gameState: room.gameState }); gameLogic.startGame.mockImplementation(state => state);
});
const actions = ['setReady','startGame','createCreature','addTrait','passEvolution','feedCreature','attack','respondAttack','useTrait'];
test.each(actions)('%s rejects verified non-owner impersonation before state/game logic', action => {
 const attacker = makeSocket('attacker', 'attacker-uid'); const before = JSON.stringify(room);
 handler[action](attacker, io, { roomId: room.id, playerId: 'host', isReady: true });
 expect(JSON.stringify(room)).toBe(before); expect(gameLogic.processAction).not.toHaveBeenCalled(); expect(gameLogic.initGame).not.toHaveBeenCalled();
 expect(attacker.emit).toHaveBeenCalledWith('evo:error', expect.any(Object));
});
test('gameStarted sends individualized state only to active seat sockets, never raw room', () => {
 io.to.mockClear(); handler.startGame(host, io, { roomId: room.id, playerId: 'host' });
 const started = io.to.mock.results.map((r,i) => [io.to.mock.calls[i][0], r.value.emit.mock.calls.filter(([event]) => event === 'evo:gameStarted')]).filter(([,calls]) => calls.length);
 expect(started.map(([id]) => id).sort()).toEqual(['guest-socket','host-socket']);
 for (const [id, calls] of started) {
  const payload = calls[0][1]; expect(payload.room).toBeUndefined(); expect(payload.deck).toBeUndefined();
  expect(payload.players[id === 'host-socket' ? 'host' : 'guest'].hand).toEqual([id === 'host-socket' ? 'HOST_PRIVATE' : 'GUEST_PRIVATE']);
  expect(payload.players[id === 'host-socket' ? 'guest' : 'host'].hand).toBe(1);
 }
});
test('public room metadata events never leak private gameState through ready or leave', () => {
 io.to.mockClear(); handler.setReady(host, io, { roomId: room.id, playerId: 'host', isReady: true });
 handler.leaveRoom(guest, io, { roomId: room.id, playerId: 'guest' });
 const publicEvents = io.to.mock.results.flatMap(r => r.value.emit.mock.calls).filter(([event]) => ['evo:playerReady','evo:playerLeft'].includes(event));
 expect(publicEvents).toHaveLength(2); expect(JSON.stringify(publicEvents)).not.toMatch(/HOST_PRIVATE|GUEST_PRIVATE|DECK_PRIVATE/);
});

test.each(actions)('%s rejects same-UID stale replaced socket', action => {
 const next = makeSocket('replacement', 'host-uid'); handler.handleReconnect(next, io, { roomId: room.id, playerId: 'host' });
 const before = JSON.stringify(room); handler[action](host, io, { roomId: room.id, playerId: 'host', isReady: true });
 expect(JSON.stringify(room)).toBe(before); expect(gameLogic.processAction).not.toHaveBeenCalled(); expect(gameLogic.initGame).not.toHaveBeenCalled();
});
test.each(actions)('%s rejects active owner targeting another seat', action => {
 const before = JSON.stringify(room); handler[action](host, io, { roomId: room.id, playerId: 'guest', isReady: true });
 expect(JSON.stringify(room)).toBe(before); expect(gameLogic.processAction).not.toHaveBeenCalled(); expect(gameLogic.initGame).not.toHaveBeenCalled();
});
test.each(actions)('%s rejects a bound socket without verified UID', action => {
 host.uid = null; const before = JSON.stringify(room); handler[action](host, io, { roomId: room.id, playerId: 'host', isReady: true });
 expect(JSON.stringify(room)).toBe(before); expect(gameLogic.processAction).not.toHaveBeenCalled(); expect(gameLogic.initGame).not.toHaveBeenCalled();
});
test.each(actions)('%s retains authorized current-seat actions', action => {
 handler[action](host, io, { roomId: room.id, playerId: 'host', isReady: true });
 if (action === 'setReady') expect(room.players[0].isReady).toBe(true);
 else if (action === 'startGame') expect(gameLogic.initGame).toHaveBeenCalledTimes(1);
 else expect(gameLogic.processAction).toHaveBeenCalledWith(expect.any(Object), 'host', expect.any(Object));
});
test('metadata allowlist excludes injected private fields and reconnect does not leak', () => {
 room.secretInternal = 'INTERNAL_PRIVATE'; room.players[0].hand = ['PLAYER_PRIVATE'];
 const next = makeSocket('replacement', 'host-uid'); handler.handleReconnect(next, io, { roomId: room.id, playerId: 'host' });
 const joined = next.emit.mock.calls.find(([event]) => event === 'evo:joinedRoom')[1];
 expect(joined.room.gameState).toBeNull(); expect(JSON.stringify(joined)).not.toMatch(/HOST_PRIVATE|GUEST_PRIVATE|DECK_PRIVATE|INTERNAL_PRIVATE|PLAYER_PRIVATE/);
});
test('state broadcasts skip disconnected and displaced mappings', () => {
 room.players[1].isDisconnected = true; io.to.mockClear(); handler.broadcastGameState(io, room.id);
 expect(io.to.mock.calls.map(([id]) => id)).toEqual(['host-socket']);
 handler._evoPlayerSockets.delete('host-socket'); io.to.mockClear(); handler.broadcastGameState(io, room.id);
 expect(io.to).not.toHaveBeenCalled();
});

test('host cannot start while a ready waiting participant is disconnected in grace', () => {
 jest.useFakeTimers();
 try {
  handler.setReady(guest, io, { roomId: room.id, playerId: 'guest', isReady: true });
  handler.handleDisconnect(guest, io);
  const before = JSON.stringify(room); handler.startGame(host, io, { roomId: room.id, playerId: 'host' });
  expect(gameLogic.initGame).not.toHaveBeenCalled(); expect(JSON.stringify(room)).toBe(before);
  const next = makeSocket('guest-next', 'guest-uid'); handler.handleReconnect(next, io, { roomId: room.id, playerId: 'guest' });
  expect(room.players[1].isReady).toBe(true);
  handler.startGame(host, io, { roomId: room.id, playerId: 'host' });
  expect(gameLogic.initGame).toHaveBeenCalledTimes(1); expect(room.phase).toBe('playing');
 } finally { jest.runOnlyPendingTimers(); jest.useRealTimers(); }
});
test('host cannot start with an invalid participant socket mapping', () => {
 handler._evoPlayerSockets.delete(guest.id);
 handler.startGame(host, io, { roomId: room.id, playerId: 'host' });
 expect(gameLogic.initGame).not.toHaveBeenCalled(); expect(room.phase).toBe('waiting');
});

test.each([
 ['createCreature','evo:creatureCreated'], ['addTrait','evo:traitAdded'], ['passEvolution','evo:playerPassed'],
 ['feedCreature','evo:creatureFed'], ['attack','evo:attackResolved'], ['respondAttack','evo:attackResolved'], ['useTrait','evo:traitUsed']
])('%s keeps side-event shape and identifies source room', (action, event) => {
 gameLogic.processAction.mockReturnValue({ success: true, gameState: room.gameState, events: [{ type: 'public-action' }] });
 io.to.mockClear(); handler[action](host, io, { roomId: room.id, playerId: 'host' });
 const side = io.to.mock.results.flatMap(r => r.value.emit.mock.calls).find(([name]) => name === event)[1];
 if (action === 'passEvolution') expect(side).toEqual({ gameId: room.id, playerId: 'host' });
 else expect(side).toEqual([{ type: 'public-action', gameId: room.id }]);
});
test('attack pending and feed chains carry the current room without private state', () => {
 room.gameState.pendingResponse = { options: ['public-option'] };
 io.to.mockClear(); handler.attack(host, io, { roomId: room.id, playerId: 'host', attackerId: 'attacker', defenderId: 'defender' });
 const pending = io.to.mock.results.flatMap(r => r.value.emit.mock.calls).find(([name]) => name === 'evo:attackPending')[1];
 expect(pending.gameId).toBe(room.id); expect(JSON.stringify(pending)).not.toMatch(/HOST_PRIVATE|GUEST_PRIVATE|DECK_PRIVATE/);
 gameLogic.processAction.mockReturnValue({ success: true, gameState: room.gameState, events: [], chainEffects: [{ type: 'chain' }] });
 io.to.mockClear(); handler.feedCreature(host, io, { roomId: room.id, playerId: 'host' });
 const chain = io.to.mock.results.flatMap(r => r.value.emit.mock.calls).find(([name]) => name === 'evo:chainTriggered')[1];
 expect(chain).toEqual([{ type: 'chain', gameId: room.id }]);
});
