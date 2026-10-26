const handler = require('../evolutionGameHandler');
const socket = (id, uid = 'owner') => ({ id, uid, emit: jest.fn(), join: jest.fn(), leave: jest.fn(), to: jest.fn(() => ({ emit: jest.fn() })) });
const io = { emit: jest.fn(), to: jest.fn(() => ({ emit: jest.fn() })) };
function create(s, maxPlayers = 2) {
  handler.createRoom(s, io, { maxPlayers, player: { id: 'host', name: 'Host', firebaseUid: 'forged' } });
  return [...handler._evoRooms.values()][0];
}
beforeEach(() => { jest.useFakeTimers(); handler._evoRooms.clear(); handler._evoPlayerSockets.clear(); jest.clearAllMocks(); });
afterEach(() => { jest.runOnlyPendingTimers(); jest.useRealTimers(); });
test('sole waiting host survives token-refresh disconnect and rebinds host/mapping', () => {
 const old = socket('old'); const room = create(old);
 handler.handleDisconnect(old, io);
 expect(handler._evoRooms.get(room.id)).toBe(room);
 const next = socket('next'); handler.handleReconnect(next, io, { roomId: room.id, playerId: 'host' });
 expect(room.hostId).toBe('next'); expect(room.players[0].firebaseUid).toBe('owner');
 expect(handler._evoPlayerSockets.get('next')).toEqual({ roomId: room.id, playerId: 'host' });
 jest.advanceTimersByTime(30001); expect(handler._evoRooms.get(room.id)).toBe(room);
});
test('reconnect rejects another verified UID despite matching caller supplied player id', () => {
 const room = create(socket('old')); const attacker = socket('attacker', 'other');
 handler.handleReconnect(attacker, io, { roomId: room.id, playerId: 'host' });
 expect(attacker.join).not.toHaveBeenCalled(); expect(room.players[0].socketId).toBe('old');
});

test('full waiting room allows owner recovery through join without duplicate seat', () => {
 const room = create(socket('old'));
 handler.joinRoom(socket('guest', 'guest-uid'), io, { roomId: room.id, player: { id: 'guest', name: 'Guest' } });
 const next = socket('next'); handler.joinRoom(next, io, { roomId: room.id, player: { id: 'host', firebaseUid: 'forged' } });
 expect(room.players).toHaveLength(2); expect(room.hostId).toBe('next'); expect(next.join).toHaveBeenCalledWith(room.id);
});
test('join sibling cannot hijack seat using id or claimed firebaseUid', () => {
 const room = create(socket('old')); const attacker = socket('bad', 'other');
 handler.joinRoom(attacker, io, { roomId: room.id, player: { id: 'host', firebaseUid: 'owner' } });
 expect(attacker.join).not.toHaveBeenCalled(); expect(room.players).toHaveLength(1);
});
test('waiting grace expires and transfers host or deletes sole-host room', () => {
 const host = socket('old'); const room = create(host);
 handler.joinRoom(socket('guest', 'guest-uid'), io, { roomId: room.id, player: { id: 'guest', name: 'Guest' } });
 handler.handleDisconnect(host, io); jest.advanceTimersByTime(30000);
 expect(room.players.map(p => p.id)).toEqual(['guest']); expect(room.hostId).toBe('guest');
 const guest = socket('guest', 'guest-uid'); handler.handleDisconnect(guest, io); jest.advanceTimersByTime(30000);
 expect(handler._evoRooms.has(room.id)).toBe(false); expect(handler._evoPlayerSockets.size).toBe(0);
});
test('old disconnect after replacement cannot remove new seat', () => {
 const old = socket('old'); const room = create(old); const next = socket('next');
 handler.handleReconnect(next, io, { roomId: room.id, playerId: 'host' });
 handler.handleDisconnect(old, io); jest.advanceTimersByTime(30000);
 expect(room.players[0].socketId).toBe('next'); expect(handler._evoRooms.has(room.id)).toBe(true);
});
test('explicit leave removes immediately and cancels grace cleanup', () => {
 const old = socket('old'); const room = create(old); handler.handleDisconnect(old, io);
 handler.leaveRoom(old, io, { roomId: room.id, playerId: 'host' });
 expect(handler._evoRooms.has(room.id)).toBe(false); expect(jest.getTimerCount()).toBe(0);
});
test('replacement socket cannot be removed by stale or unrelated explicit leave', () => {
 const old = socket('old'); const room = create(old); const next = socket('next');
 handler.handleReconnect(next, io, { roomId: room.id, playerId: 'host' });
 handler.leaveRoom(old, io, { roomId: room.id, playerId: 'host' });
 expect(handler._evoRooms.has(room.id)).toBe(true);
});
test('in-game recovery uses object-map state and hides other hands', () => {
 const old = socket('old'); const room = create(old); room.phase = 'playing';
 room.gameState = { players: { host: { id: 'host', hand: ['own'], creatures: [] }, other: { id: 'other', hand: ['secret'], creatures: [] } }, deck: [], discardPile: [] };
 handler.handleDisconnect(old, io); jest.advanceTimersByTime(30000);
 expect(handler._evoPlayerSockets.has('old')).toBe(false); expect(room.players).toHaveLength(1);
 const next = socket('next'); handler.handleReconnect(next, io, { roomId: room.id, playerId: 'host' });
 const restored = next.emit.mock.calls.find(([event]) => event === 'evo:reconnected')[1];
 expect(restored.gameState.players.host.hand).toEqual(['own']); expect(restored.gameState.players.other.hand).toBe(1);
 expect(JSON.stringify(next.emit.mock.calls)).not.toContain('secret'); expect(room.players[0].isDisconnected).toBe(false);
});
test('missing verified identity cannot create, join or recover seats', () => {
 const room = create(socket('old')); const unknown = socket('unknown', null);
 handler.handleReconnect(unknown, io, { roomId: room.id, playerId: 'host' });
 handler.joinRoom(unknown, io, { roomId: room.id, player: { id: 'new' } });
 handler.createRoom(unknown, io, { player: { id: 'other' } });
 expect(unknown.join).not.toHaveBeenCalled(); expect(handler._evoRooms.size).toBe(1);
});

test('duplicate disconnect does not extend the bounded grace window', () => {
 const old = socket('old'); const room = create(old);
 handler.handleDisconnect(old, io); jest.advanceTimersByTime(20000);
 handler.handleDisconnect(old, io); jest.advanceTimersByTime(10000);
 expect(handler._evoRooms.has(room.id)).toBe(false);
});
test('in-progress recovery before expiry cancels cleanup and keeps private state', () => {
 const old = socket('old'); const room = create(old); room.phase = 'playing';
 room.gameState = { players: { host: { id: 'host', hand: [], creatures: [] } } };
 handler.handleDisconnect(old, io);
 const next = socket('next'); handler.handleReconnect(next, io, { roomId: room.id, playerId: 'host' });
 expect(jest.getTimerCount()).toBe(0); jest.advanceTimersByTime(30000);
 expect(handler._evoPlayerSockets.has('next')).toBe(true); expect(room.hostId).toBe('next');
 expect(next.emit).toHaveBeenCalledWith('evo:joinedRoom', expect.objectContaining({ room: expect.objectContaining({ gameState: null }) }));
});

test('waiting peer connection notifications are immediate and contain public metadata only', () => {
 const host = socket('host'); const room = create(host);
 const guest = socket('guest', 'guest-uid'); handler.joinRoom(guest, io, { roomId: room.id, player: { id: 'guest', name: 'Guest' } });
 const notifications = []; io.to.mockImplementation(() => ({ emit: (event, payload) => { if (event === 'evo:playerConnectionChanged') notifications.push(JSON.parse(JSON.stringify(payload))); } }));
 room.gameState = { players: { host: { hand: ['secret'] } } };
 handler.handleDisconnect(guest, io);
 expect(notifications).toHaveLength(1); expect(notifications[0].room.players.find(p => p.id === 'guest').isDisconnected).toBe(true);
 expect(notifications[0].room.gameState).toBeNull(); expect(JSON.stringify(notifications)).not.toContain('secret');
 handler.handleReconnect(socket('new-guest', 'guest-uid'), io, { roomId: room.id, playerId: 'guest' });
 expect(notifications).toHaveLength(2); expect(notifications[1].room.players.find(p => p.id === 'guest').isDisconnected).toBe(false);
});

test('personalized reconnect state identifies its room without exposing raw room or other hands', () => {
 const old = socket('old'); const room = create(old); room.phase = 'playing';
 room.gameState = { players: { host: { id: 'host', hand: ['own'], creatures: [] }, other: { id: 'other', hand: ['secret'], creatures: [] } } };
 const next = socket('next'); handler.handleReconnect(next, io, { roomId: room.id, playerId: 'host' });
 const restored = next.emit.mock.calls.find(([event]) => event === 'evo:reconnected')[1];
 expect(restored.gameState.gameId).toBe(room.id);
 expect(JSON.stringify(restored)).not.toContain('secret');
});
