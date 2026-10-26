const test = require('node:test');
const assert = require('node:assert/strict');
const { createPresenceLifecycle } = require('./presenceLifecycle');
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; };
const socket = id => ({ id, uid: 'owner', connected: true });
function fixture(overrides = {}) {
  const calls = [];
  const lifecycle = createPresenceLifecycle({
    getPlayerId: async () => 'player',
    presenceService: {
      setOnline: async id => calls.push(['online', id]),
      setOffline: async id => calls.push(['offline', id]),
      setInGame: async (id, game) => calls.push(['game', id, game]),
      ...overrides,
    },
  });
  return { lifecycle, calls };
}

test('replacement online write waits for old pending offline write', async () => {
  const started = deferred(), release = deferred(); let state;
  const { lifecycle } = fixture({
    setOnline: async () => { state = 'online'; },
    setOffline: async () => { started.resolve(); await release.promise; state = 'offline'; },
  });
  const old = socket('old'), fresh = socket('fresh');
  await lifecycle.online(old); old.connected = false;
  const leaving = lifecycle.disconnect(old); await started.promise;
  const replacing = lifecycle.online(fresh);
  release.resolve(); await Promise.all([leaving, replacing]);
  assert.equal(state, 'online');
});

test('disconnect during identity lookup never writes a late online state', async () => {
  const lookup = deferred(), calls = [];
  const lifecycle = createPresenceLifecycle({ getPlayerId: () => lookup.promise, presenceService: {
    setOnline: async () => calls.push('online'), setOffline: async () => calls.push('offline'),
  } });
  const old = socket('old'); const joining = lifecycle.online(old);
  old.connected = false; const leaving = lifecycle.disconnect(old);
  lookup.resolve('player'); await Promise.all([joining, leaving]);
  assert.deepEqual(calls, []);
});

test('disconnect while online write is pending finishes offline', async () => {
  const started = deferred(), release = deferred(); let state;
  const { lifecycle } = fixture({
    setOnline: async () => { started.resolve(); await release.promise; state = 'online'; },
    setOffline: async () => { state = 'offline'; },
  });
  const old = socket('old'); const joining = lifecycle.online(old); await started.promise;
  old.connected = false; const leaving = lifecycle.disconnect(old);
  release.resolve(); await Promise.all([joining, leaving]); assert.equal(state, 'offline');
});

test('one disconnected tab does not mark another active game tab offline', async () => {
  const { lifecycle, calls } = fixture(); const first = socket('first'), second = socket('second');
  await lifecycle.online(first); await lifecycle.online(second); await lifecycle.inGame(second, 'game');
  calls.length = 0; first.connected = false; await lifecycle.disconnect(first);
  assert.deepEqual(calls, [['game', 'player', 'game']]);
  second.connected = false; await lifecycle.disconnect(second);
  assert.deepEqual(calls.at(-1), ['offline', 'player']);
});

test('game update before lookup completes is retained and leaving restores online', async () => {
  const lookup = deferred(), calls = []; const s = socket('one');
  const lifecycle = createPresenceLifecycle({ getPlayerId: () => lookup.promise, presenceService: {
    setInGame: async (_id, game) => calls.push(game), setOnline: async () => calls.push('online'),
  } });
  const joining = lifecycle.online(s), playing = lifecycle.inGame(s, 'game');
  lookup.resolve('player'); await Promise.all([joining, playing]); assert.equal(s.firebasePlayerId, 'player');
  assert.deepEqual(calls, ['game', 'game']); await lifecycle.inGame(s, null); assert.equal(calls.at(-1), 'online');
});

test('failed write does not poison later replacement updates', async () => {
  let attempts = 0; const { lifecycle } = fixture({ setOnline: async () => { if (++attempts === 1) throw new Error('temporary'); } });
  const s = socket('one'); await assert.rejects(lifecycle.online(s), /temporary/);
  await lifecycle.online(s); assert.equal(attempts, 2);
});

test('unregistered sockets cannot change presence or clear another connection', async () => {
  const { lifecycle, calls } = fixture(); const s = socket('one'); await lifecycle.online(s); calls.length = 0;
  await lifecycle.inGame(socket('unregistered'), 'game'); await lifecycle.disconnect(socket('one'));
  assert.deepEqual(calls, []);
});

test('actual server handlers use the ordered lifecycle for replacement connections', async () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const source = fs.readFileSync(require.resolve('../server'), 'utf8');
  const presence = source.match(/socket.on\('setPresence', async \(\) => \{[\s\S]*?\n  \}\);/)[0];
  const disconnect = source.match(/socket.on\('disconnect', async \(reason\) => \{[\s\S]*?\n  \}\);/)[0];
  const started = deferred(), release = deferred(); let state;
  const { lifecycle } = fixture({
    setOnline: async () => { state = 'online'; },
    setOffline: async () => { started.resolve(); await release.promise; state = 'offline'; },
  });
  function handlers(id) {
    const h = {}, s = socket(id); s.on = (event, fn) => { h[event] = fn; };
    vm.runInNewContext(presence + '\n' + disconnect, {
      socket: s, io: {}, presenceLifecycle: lifecycle, console: { log() {}, error() {} },
      playerSockets: new Map(), evolutionHandler: { handleDisconnect() {} }, handlePlayerDisconnect() {},
    });
    return { h, s };
  }
  const old = handlers('old'), fresh = handlers('fresh'); await old.h.setPresence();
  old.s.connected = false; const leaving = old.h.disconnect('client'); await started.promise;
  const joining = fresh.h.setPresence(); release.resolve(); await Promise.all([leaving, joining]);
  assert.equal(state, 'online');
});
