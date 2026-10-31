const { randomUUID } = require('node:crypto');
const { publicGameState } = require('../security/socketSecurity');

// Capture immutable, recipient-redacted views before asynchronous persistence.
function createReplayRecorder(store, onError = () => {}) {
  const matches = new WeakMap();
  function start(state) {
    const seats = state.players.map((p, seat) => ({ seat, id: p.id,
      uid: p.firebaseUid || p.ownerUid || null, name: p.name.slice(0, 50) }));
    matches.set(state, { id: randomUUID(), seats, seq: 0, tail: Promise.resolve(), failed: false,
      startedAt: new Date().toISOString(), last: null });
  }
  function capture(state, type = 'state', payload = {}, privateView = null) {
    const match = matches.get(state);
    if (!match || match.failed) return;
    const views = match.seats.map(seat => {
      const view = publicGameState(state, seat.id);
      if (privateView?.audience.includes(seat.id)) view.replayAction = structuredClone(privateView.payload);
      return { seat: seat.seat, state: view };
    });
    const fingerprint = JSON.stringify({ views, type, payload });
    if (fingerprint === match.last) return;
    match.last = fingerprint;
    const frame = { matchId: match.id, gameId: state.gameId, seats: match.seats,
      startedAt: match.startedAt, seq: ++match.seq, eventId: randomUUID(), type,
      round: state.currentRound || 1, at: new Date().toISOString(), payload: structuredClone(payload),
      views, winner: state.winner || null, complete: state.gamePhase === 'finished',
      scores: structuredClone(state.scores || {}) };
    match.tail = match.tail.then(() => {
      if (!match.failed) return store.append(frame);
    }).catch(() => { match.failed = true; onError(state.gameId); });
  }
  return { start, capture, flush: state => matches.get(state)?.tail || Promise.resolve() };
}
module.exports = { createReplayRecorder };
