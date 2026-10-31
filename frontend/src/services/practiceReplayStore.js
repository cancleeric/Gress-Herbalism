// AI practice stays in this tab's memory. It never uploads client-authoritative
// results as verified multiplayer scores or writes localStorage/IndexedDB/SQL.
const records = new Map();
const MAX_MATCHES = 20, MAX_FRAMES = 3000, MAX_BYTES = 32 * 1024 * 1024;
let totalBytes = 0;
const copy = value => JSON.parse(JSON.stringify(value));
const newId = () => {
  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `ai-${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
};

function publicSnapshot(state, humanId) {
  return {
    gamePhase: state.gamePhase, currentPlayerIndex: state.currentPlayerIndex,
    winner: state.winner || null, currentRound: state.round || state.currentRound || 1,
    scores: Object.fromEntries(state.players.map(p => [p.id, p.score || 0])),
    players: state.players.map(p => ({ id: p.id, name: p.name, isAI: !!p.isAI,
      isActive: p.isActive !== false, score: p.score || 0,
      hand: p.id === humanId ? copy(p.hand || []) : (p.hand || []).map(() => ({ hidden: true })) })),
    hiddenCards: (state.hiddenCards || []).map(() => ({ hidden: true })), gameHistory: [],
  };
}
function publicPayload(type, event, humanId) {
  const result = {};
  for (const key of ['round', 'startPlayerIndex', 'playerId', 'targetPlayerId', 'questionType', 'guessingPlayerId',
    'guessedColors', 'currentDeciderId', 'decisions', 'followingPlayers', 'declinedPlayers', 'isFollowing']) {
    if (event[key] !== undefined) result[key] = copy(event[key]);
  }
  if (type === 'questionAsked' && (event.playerId === humanId || event.targetPlayerId === humanId)) {
    for (const key of ['colors', 'giveColor', 'getColor']) if (event[key] !== undefined) result[key] = copy(event[key]);
  }
  if (type === 'turnEnded' && event.playerId === humanId && event.prediction) result.prediction = copy(event.prediction);
  if (type === 'CARD_TRANSFER') {
    Object.assign(result, { from: event.from, to: event.to, count: event.cards?.length || 0 });
    if (event.from === humanId || event.to === humanId) result.cards = copy(event.cards || []);
  }
  if (type === 'guessResult') {
    result.hiddenCards = copy(event.hiddenCards || []);
    result.isCorrect = !!event.isCorrect;
    result.scoreChanges = copy(event.scoreChanges || {});
  }
  return result;
}
export function createPracticeReplayRecorder(ownerUid, humanId, onError = () => {}) {
  if (!ownerUid || !humanId) return null;
  const id = newId();
  let record = null, last = null, closed = false;
  return {
    capture(state, type = 'state', event = {}) {
      if (closed || !state.players?.some(p => p.id === humanId) || state.gamePhase === 'waiting') return;
      const snapshot = publicSnapshot(state, humanId), payload = publicPayload(type, event, humanId);
      const fingerprint = JSON.stringify({ snapshot, type, payload });
      if (last === fingerprint) return;
      const size = fingerprint.length * 2;
      for (const [key, old] of records) {
        if (totalBytes + size <= MAX_BYTES && (record || records.size < MAX_MATCHES)) break;
        if (key !== id && old.status !== 'recording') { records.delete(key); totalBytes -= old.bytes; }
      }
      if (totalBytes + size > MAX_BYTES || (record?.frames.length || 0) >= MAX_FRAMES || (!record && records.size >= MAX_MATCHES)) {
        closed = true; if (record) record.status = 'interrupted'; onError(); return;
      }
      if (!record) {
        record = { matchId: id, ownerUid, mode: 'ai', startedAt: new Date().toISOString(),
          frames: [], status: 'recording', bytes: 0 };
        records.set(id, record);
      }
      record.frames.push({ seq: record.frames.length + 1, round: snapshot.currentRound,
        type, state: snapshot, payload, at: new Date().toISOString() });
      record.status = state.gamePhase === 'finished' ? 'complete' : record.status;
      record.winner = state.players.find(p => p.id === state.winner)?.name || null;
      record.rounds = snapshot.currentRound;
      record.participants = snapshot.players.map(p => ({ player_name: p.name,
        final_score: p.score, is_winner: state.winner === p.id }));
      record.bytes += size; totalBytes += size; last = fingerprint;
    },
    close() { closed = true; if (record?.status === 'recording') record.status = 'interrupted'; },
  };
}
export function practiceHistory(ownerUid) {
  return [...records.values()].reverse().filter(r => ownerUid && r.ownerUid === ownerUid)
    .map(r => copy({ matchId: r.matchId, mode: r.mode, startedAt: r.startedAt,
      status: r.status, winner: r.winner, rounds: r.rounds, participants: r.participants }));
}
export function practiceReplay(ownerUid, matchId) {
  const record = records.get(matchId);
  if (!ownerUid || record?.ownerUid !== ownerUid) return null;
  return copy({ status: record.status, frames: record.frames, next: null });
}
