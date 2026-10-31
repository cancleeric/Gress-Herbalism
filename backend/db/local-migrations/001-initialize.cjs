'use strict';

// Local Docker ONLY. Base columns mirror the approved 11505 offline material.
// Knex supplies the transaction/history/lock; do not execute BEGIN/COMMIT here.
const fs = require('node:fs');
const crypto = require('node:crypto');
const replayPath = require.resolve('../migrations/11483_persistent_replay');
const replayHash = '8f7d01a34a705a0d5448398f9507cfc0ec332fb9ea71cbc88c8ad1bed674ee1e';
const base = `
CREATE SCHEMA herbalism;
CREATE TABLE herbalism.players (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), firebase_uid VARCHAR(128) UNIQUE,
 display_name VARCHAR(50) NOT NULL, email VARCHAR(255), avatar_url TEXT,
 total_score INTEGER DEFAULT 0, games_played INTEGER DEFAULT 0, games_won INTEGER DEFAULT 0,
 created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_players_display_name ON herbalism.players(display_name);
CREATE INDEX idx_players_firebase_uid ON herbalism.players(firebase_uid);
CREATE TABLE herbalism.game_history (
 id SERIAL PRIMARY KEY, game_id VARCHAR(100) NOT NULL,
 winner_id UUID REFERENCES herbalism.players(id), winner_name VARCHAR(50),
 player_count INTEGER, rounds_played INTEGER DEFAULT 1, duration_seconds INTEGER,
 created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_game_history_created ON herbalism.game_history(created_at DESC);
CREATE INDEX idx_game_history_winner ON herbalism.game_history(winner_id);
CREATE TABLE herbalism.game_participants (
 id SERIAL PRIMARY KEY, game_history_id INTEGER REFERENCES herbalism.game_history(id) ON DELETE CASCADE,
 player_id UUID REFERENCES herbalism.players(id), player_name VARCHAR(50),
 final_score INTEGER DEFAULT 0, is_winner BOOLEAN DEFAULT FALSE,
 created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_game_participants_game ON herbalism.game_participants(game_history_id);
CREATE INDEX idx_game_participants_player ON herbalism.game_participants(player_id);
`;

exports.up = async function up(db) {
  if (crypto.createHash('sha256').update(fs.readFileSync(replayPath)).digest('hex') !== replayHash) {
    throw new Error('Reviewed replay material changed; stop before initialization');
  }
  const result = await db.raw("SELECT current_database() AS database, current_setting('server_version_num')::integer AS version, to_regnamespace('herbalism') AS existing");
  const row = result.rows[0];
  if (row.database !== 'herbalism_db' || row.version < 150000 || row.version >= 160000 || row.existing !== null) {
    throw new Error('Local initialization target/version/schema mismatch; review drift');
  }
  await db.raw(base);
  for (const statement of require(replayPath).candidate().statements) await db.raw(statement);
  for (const name of ['players', 'game_history', 'game_participants']) {
    await db.raw(`ALTER TABLE herbalism.${name} ENABLE ROW LEVEL SECURITY`);
  }
};
exports.down = async function down() {
  throw new Error('Destructive rollback unavailable; retain data and obtain a new exact authorization');
};
exports.config = { transaction: true };
