-- OFFLINE REVIEW CANDIDATE ONLY. No auto execution.
-- Target squid-com-hurricanesoft / squid-postgres-prod / herbalism_db / herbalism.
-- Separate live approval, registered runner, same-target verified compressed backup required.
-- All probe rows are rolled back. Runner must stop and close on any SQL error.
BEGIN;
DO $$
DECLARE probe_player uuid; probe_game integer; probe_match uuid := gen_random_uuid();
BEGIN
  IF current_database() <> 'herbalism_db' THEN RAISE EXCEPTION 'Wrong database'; END IF;
  INSERT INTO herbalism.players(firebase_uid, display_name)
    VALUES ('__11496_probe__', '驗證玩家') RETURNING id INTO probe_player;
  INSERT INTO herbalism.game_history(game_id,match_id,replay_version,engine_version,
    started_at,finished_at,replay_status,last_event_seq,player_count,winner_id)
    VALUES ('__11496_probe__',probe_match,1,'herbalism-v1',now(),now(),'complete',1,1,probe_player)
    RETURNING id INTO probe_game;
  INSERT INTO herbalism.game_participants(game_history_id,player_id,player_name,
    seat_index,firebase_uid,final_score,is_winner)
    VALUES (probe_game,probe_player,'驗證玩家',0,'__11496_probe__',7,true);
  INSERT INTO herbalism.game_events(game_history_id,seq,event_id,event_version,
    round_number,event_type,occurred_at,public_payload)
    VALUES (probe_game,1,gen_random_uuid(),1,1,'state',now(),'{}'::jsonb);
  INSERT INTO herbalism.game_snapshots(game_history_id,event_seq,viewer_seat,snapshot_version,state)
    VALUES (probe_game,1,0,1,'{"players":[],"hiddenCards":[{"hidden":true}]}'::jsonb);
  -- Each inner subtransaction must reject invalid event/view records.
  BEGIN
    INSERT INTO herbalism.game_events(game_history_id,seq,event_id,event_version,
      round_number,event_type,occurred_at,public_payload)
      VALUES (probe_game,1,gen_random_uuid(),1,1,'state',now(),'{}'::jsonb);
    RAISE EXCEPTION 'Duplicate event sequence unexpectedly accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO herbalism.game_snapshots(game_history_id,event_seq,viewer_seat,snapshot_version,state)
      VALUES (probe_game,1,1,1,'{}'::jsonb);
    RAISE EXCEPTION 'Unregistered viewer seat unexpectedly accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO herbalism.game_events(game_history_id,seq,event_id,event_version,
      round_number,event_type,occurred_at,public_payload)
      VALUES (probe_game,2,gen_random_uuid(),1,1,'',now(),'{}'::jsonb);
    RAISE EXCEPTION 'Invalid event type unexpectedly accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  IF (SELECT count(*) FROM herbalism.game_snapshots s
      JOIN herbalism.game_participants p ON p.game_history_id=s.game_history_id AND p.seat_index=s.viewer_seat
      WHERE s.game_history_id=probe_game AND p.firebase_uid='__11496_probe__') <> 1
    THEN RAISE EXCEPTION 'Viewer snapshot probe failed'; END IF;
END $$;
ROLLBACK;
