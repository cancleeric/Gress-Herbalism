-- OFFLINE REVIEW CANDIDATE ONLY. No auto execution.
-- Target squid-com-hurricanesoft / squid-postgres-prod / herbalism_db / herbalism.
-- Separate live approval, registered runner, same-target verified compressed backup required.
BEGIN;
DO $$ BEGIN
  IF current_database() <> 'herbalism_db' THEN RAISE EXCEPTION 'Wrong database'; END IF;
  IF current_setting('server_version_num')::integer < 150000 THEN RAISE EXCEPTION 'PostgreSQL 15+ required'; END IF;
  IF to_regnamespace('herbalism') IS NOT NULL THEN
    RAISE EXCEPTION 'Schema already exists: stop and review drift; do not replay initialization';
  END IF;
END $$;
SELECT current_database() AS database, current_user AS executor,
       current_setting('server_version_num') AS postgres_version;
CREATE SCHEMA herbalism;
CREATE TABLE herbalism.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid VARCHAR(128) UNIQUE,
  display_name VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  avatar_url TEXT,

  -- 統計數據
  total_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,

  -- 時間戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_players_display_name ON herbalism.players(display_name);
CREATE INDEX IF NOT EXISTS idx_players_firebase_uid ON herbalism.players(firebase_uid);

-- ==================== 遊戲歷史記錄表 ====================
CREATE TABLE herbalism.game_history (
  id SERIAL PRIMARY KEY,
  game_id VARCHAR(100) NOT NULL,
  winner_id UUID REFERENCES herbalism.players(id),
  winner_name VARCHAR(50),
  player_count INTEGER,
  rounds_played INTEGER DEFAULT 1,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_game_history_created ON herbalism.game_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_history_winner ON herbalism.game_history(winner_id);

-- ==================== 遊戲參與者表 ====================
CREATE TABLE herbalism.game_participants (
  id SERIAL PRIMARY KEY,
  game_history_id INTEGER REFERENCES herbalism.game_history(id) ON DELETE CASCADE,
  player_id UUID REFERENCES herbalism.players(id),
  player_name VARCHAR(50),
  final_score INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_game_participants_game ON herbalism.game_participants(game_history_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_player ON herbalism.game_participants(player_id);


ALTER TABLE herbalism.game_history
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
       (finished_at IS NOT NULL AND finished_at >= started_at AND last_event_seq > 0));
ALTER TABLE herbalism.game_participants
    ADD COLUMN seat_index INTEGER CHECK (seat_index >= 0 AND seat_index < 4),
    ADD COLUMN firebase_uid VARCHAR(128),
    ADD COLUMN is_ai BOOLEAN NOT NULL DEFAULT FALSE,
    ADD CONSTRAINT replay_seat_unique UNIQUE (game_history_id, seat_index),
    ADD CONSTRAINT replay_identity_unique UNIQUE (game_history_id, firebase_uid);
CREATE INDEX replay_participant_history ON herbalism.game_participants
    (firebase_uid, game_history_id DESC) WHERE firebase_uid IS NOT NULL;
CREATE TABLE herbalism.game_events (
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
  );
CREATE TABLE herbalism.game_snapshots (
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
  );
ALTER TABLE herbalism.game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE herbalism.game_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE herbalism.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE herbalism.game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE herbalism.game_participants ENABLE ROW LEVEL SECURITY;
COMMIT;
