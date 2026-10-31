-- OFFLINE REVIEW CANDIDATE ONLY. No auto execution.
-- Target squid-com-hurricanesoft / squid-postgres-prod / herbalism_db / herbalism.
-- Separate live approval, registered runner, same-target verified compressed backup required.
DO $$ BEGIN
  IF current_database() <> 'herbalism_db' THEN RAISE EXCEPTION 'Wrong database'; END IF;
  IF current_setting('server_version_num')::integer < 150000 THEN RAISE EXCEPTION 'PostgreSQL 15+ required'; END IF;
  IF to_regnamespace('herbalism') IS NOT NULL THEN
    RAISE EXCEPTION 'Schema already exists: stop and review drift; do not replay initialization';
  END IF;
END $$;
SELECT current_database() AS database, current_user AS executor,
       current_setting('server_version_num') AS postgres_version;

-- Dedicated schema must be absent. No existing public rows are read or copied.
-- Save this empty-target inventory with the runner's separate whole-DB backup.
SELECT 'herbalism' AS schema_name, n AS table_name, 0::bigint AS expected_before_count
FROM unnest(ARRAY['players','game_history','game_participants','game_events','game_snapshots']) AS n;
