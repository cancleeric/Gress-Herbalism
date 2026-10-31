'use strict';

// Same append/history/replay DTO contract as replayStore; no DB, files or credentials.
function createMemoryReplayStore({ maxMatches = 100, maxFrames = 5000, maxBytes = 134217728 } = {}) {
  for (const value of [maxMatches, maxFrames, maxBytes]) {
    if (!Number.isSafeInteger(value) || value < 1) throw new Error('Invalid replay retention limit');
  }
  const matches = new Map();
  let bytes = 0;
  const storage = Object.freeze({ mode: 'memory', persistent: false, maxMatches, maxFrames });
  async function append(input) {
    const f = structuredClone(input);
    if (!f.matchId || !f.eventId || !Number.isSafeInteger(f.seq) || f.seq < 1 ||
        !Array.isArray(f.seats) || f.seats.length < 2 || f.seats.length > 4 ||
        !Array.isArray(f.views) || f.views.length !== f.seats.length) throw new Error('Invalid replay frame');
    const seats = new Set(f.seats.map(s => s.seat));
    const ids = new Set(f.seats.map(s => s.id));
    const uids = f.seats.map(s => s.uid).filter(Boolean);
    if (seats.size !== f.seats.length || ids.size !== f.seats.length ||
        new Set(uids).size !== uids.length ||
        f.seats.some(s => !Number.isInteger(s.seat) || s.seat < 0 || s.seat > 3) ||
        new Set(f.views.map(v => v.seat)).size !== seats.size || f.views.some(v => !seats.has(v.seat))) {
      throw new Error('Invalid replay seats');
    }
    let record = matches.get(f.matchId);
    if (record && JSON.stringify(record.seats) !== JSON.stringify(f.seats)) throw new Error('Replay identity conflict');
    if (record && f.seq <= record.frames.length) {
      if (record.frames[f.seq - 1].eventId !== f.eventId) throw new Error('Replay conflict');
      return;
    }
    if (f.seq !== (record?.frames.length || 0) + 1) throw new Error('Replay gap');
    const frame = { seq: f.seq, eventId: f.eventId, type: f.type, round: f.round,
      at: f.at, payload: f.payload, views: f.views };
    const size = Buffer.byteLength(JSON.stringify(frame)) + (record ? 0 : Buffer.byteLength(JSON.stringify(f.seats)));
    if (f.seq > maxFrames || size > maxBytes) {
      if (record) record.status = 'interrupted';
      throw new Error('Memory replay capacity reached');
    }
    // Never silently discard a live match. Retire oldest completed/interrupted records only.
    for (const [id, old] of matches) {
      if (bytes + size <= maxBytes && (record || matches.size < maxMatches)) break;
      if (id !== f.matchId && old.status !== 'recording') { matches.delete(id); bytes -= old.bytes; }
    }
    if (bytes + size > maxBytes || (!record && matches.size >= maxMatches)) {
      if (record) record.status = 'interrupted';
      throw new Error('Memory replay capacity reached');
    }
    if (!record) {
      record = { matchId: f.matchId, startedAt: f.startedAt, seats: f.seats, frames: [], bytes: 0 };
      matches.set(f.matchId, record);
    }
    record.frames.push(frame); record.bytes += size; bytes += size;
    record.status = f.complete ? 'complete' : record.status === 'complete' ? 'complete' : 'recording';
    record.rounds = f.round;
    record.scores = f.scores;
    if (f.complete) { record.winnerId = f.winner; record.winner = f.seats.find(s => s.id === f.winner)?.name || null; }
  }
  async function history(uid) {
    if (!uid) return [];
    return [...matches.values()].reverse().filter(r => r.seats.some(s => s.uid === uid)).slice(0, 50)
      .map(r => ({ matchId: r.matchId, startedAt: r.startedAt, status: r.status,
        winner: r.winner || null, rounds: r.rounds,
        participants: r.seats.map(s => ({ player_name: s.name,
          final_score: r.scores?.[s.id] || 0, is_winner: r.status === 'complete' && s.id === r.winnerId })) }));
  }
  async function replay(uid, matchId, after = 0) {
    if (!Number.isSafeInteger(after) || after < 0) throw new Error('Invalid replay cursor');
    const r = matches.get(matchId), seat = uid && r?.seats.find(s => s.uid === uid);
    if (!seat) return null;
    const frames = r.frames.filter(f => f.seq > after).slice(0, 100).map(f => ({
      seq: f.seq, type: f.type, round: f.round, at: f.at, payload: f.payload,
      state: f.views.find(v => v.seat === seat.seat).state }));
    return structuredClone({ status: r.status, viewerSeat: seat.seat, frames,
      next: frames.length === 100 ? frames[frames.length - 1].seq : null });
  }
  return { append, history, replay, storage };
}
module.exports = { createMemoryReplayStore };
