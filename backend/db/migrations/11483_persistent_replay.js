'use strict';

// OFFLINE CANDIDATE ONLY. Nothing connects, executes, or registers at import.
// Requires reviewed herbalism base initialization material (players/game_history/game_participants).
// Legacy rows remain readable but must NOT be advertised as replayable.
// New writes must atomically persist event + viewer snapshots + head sequence.
// A unique completion transition must update results/stats in that same transaction.
const up = Object.freeze([
  `ALTER TABLE herbalism.game_history
    ADD COLUMN match_id UUID UNIQUE,
    ADD COLUMN replay_version INTEGER CHECK (replay_version > 0),
    ADD COLUMN engine_version TEXT,
    ADD COLUMN started_at TIMESTAMPTZ,
    ADD COLUMN finished_at TIMESTAMPTZ,
    ADD COLUMN replay_status TEXT CHECK (replay_status IN ('recording','complete','interrupted')),
    ADD COLUMN last_event_seq INTEGER NOT NULL DEFAULT 0 CHECK (last_event_seq >= 0),
    ADD CONSTRAINT replay_metadata_consistent CHECK (match_id IS NULL OR
      (replay_version IS NOT NULL AND engine_version IS NOT NULL AND
       started_at IS NOT NULL AND replay_status IS NOT NULL)),
    ADD CONSTRAINT replay_finished_consistent CHECK
      (replay_status IS DISTINCT FROM 'complete' OR
       (finished_at IS NOT NULL AND finished_at >= started_at AND last_event_seq > 0))`,
  // Nullable additions deliberately preserve old games, AI and legacy seats.
  `ALTER TABLE herbalism.game_participants
    ADD COLUMN seat_index INTEGER CHECK (seat_index >= 0 AND seat_index < 4),
    ADD COLUMN firebase_uid VARCHAR(128),
    ADD COLUMN is_ai BOOLEAN NOT NULL DEFAULT FALSE,
    ADD CONSTRAINT replay_seat_unique UNIQUE (game_history_id, seat_index),
    ADD CONSTRAINT replay_identity_unique UNIQUE (game_history_id, firebase_uid)`,
  `CREATE INDEX replay_participant_history ON herbalism.game_participants
    (firebase_uid, game_history_id DESC) WHERE firebase_uid IS NOT NULL`,
  `CREATE TABLE herbalism.game_events (
    game_history_id INTEGER NOT NULL REFERENCES herbalism.game_history(id),
    seq INTEGER NOT NULL CHECK (seq > 0),
    event_id UUID NOT NULL UNIQUE,
    event_version INTEGER NOT NULL CHECK (event_version > 0),
    round_number INTEGER NOT NULL CHECK (round_number > 0),
    event_type TEXT NOT NULL CHECK (length(event_type) BETWEEN 1 AND 64),
    actor_seat INTEGER CHECK (actor_seat >= 0 AND actor_seat < 4),
    occurred_at TIMESTAMPTZ NOT NULL,
    public_payload JSONB NOT NULL CHECK (jsonb_typeof(public_payload) = 'object'),
    PRIMARY KEY (game_history_id, seq)
  )`,
  // Only pre-redacted per-player state. Never send one omniscient JSON to a browser.
  // Store actual dealt outcomes in each entitled view; no seed-only reconstruction.
  `CREATE TABLE herbalism.game_snapshots (
    game_history_id INTEGER NOT NULL,
    event_seq INTEGER NOT NULL,
    viewer_seat INTEGER NOT NULL,
    snapshot_version INTEGER NOT NULL CHECK (snapshot_version > 0),
    state JSONB NOT NULL CHECK (jsonb_typeof(state) = 'object'),
    PRIMARY KEY (game_history_id, event_seq, viewer_seat),
    FOREIGN KEY (game_history_id, event_seq)
      REFERENCES herbalism.game_events(game_history_id, seq),
    FOREIGN KEY (game_history_id, viewer_seat)
      REFERENCES herbalism.game_participants(game_history_id, seat_index)
  )`,
  // Default-deny new tables. No roles, grants or public policies in this scope.
  // Live role/RLS compatibility must be separately reviewed before activation.
  `ALTER TABLE herbalism.game_events ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE herbalism.game_snapshots ENABLE ROW LEVEL SECURITY`,
]);

function candidate() {
  return { id: '11483_persistent_replay', offlineOnly: true,
    prerequisites: ['base schema verified', 'legacy access policy audit',
      'transactional writer and per-participant reader reviewed',
      'separate live authorization and verified backup'], statements: [...up] };
}

function rollbackCandidate() {
  // Lossless operational rollback: disable new recording/read routes, retain data.
  // Destructive schema rollback is intentionally unavailable without a fresh scope.
  return { mode: 'retain-data-disable-integration', statements: [],
    requiresFreshAuthorizationForDDL: true };
}

module.exports = { candidate, rollbackCandidate };
