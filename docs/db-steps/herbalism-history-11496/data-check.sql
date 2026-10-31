-- OFFLINE REVIEW CANDIDATE ONLY. No auto execution.
-- Target squid-com-hurricanesoft / squid-postgres-prod / herbalism_db / herbalism.
-- Separate live approval, registered runner, same-target verified compressed backup required.
DO $$
DECLARE target_name text; row_count bigint; rls boolean;
BEGIN
  IF current_database() <> 'herbalism_db' THEN RAISE EXCEPTION 'Wrong database'; END IF;
  FOREACH target_name IN ARRAY ARRAY['players','game_history','game_participants','game_events','game_snapshots'] LOOP
    SELECT c.relrowsecurity INTO rls FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='herbalism' AND c.relname=target_name AND c.relkind='r';
    IF rls IS DISTINCT FROM true THEN RAISE EXCEPTION 'Missing table or RLS: %', target_name; END IF;
    EXECUTE format('SELECT count(*) FROM herbalism.%I',target_name) INTO row_count;
    IF row_count <> 0 THEN RAISE EXCEPTION 'Unexpected data after rolled-back probe: %',target_name; END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='herbalism') THEN
    RAISE EXCEPTION 'Unexpected policy: access-policy approval is separate';
  END IF;
END $$;
SELECT tablename,rowsecurity FROM pg_tables WHERE schemaname='herbalism' ORDER BY tablename;
SELECT conrelid::regclass AS relation, conname, pg_get_constraintdef(oid) AS definition
  FROM pg_constraint WHERE connamespace='herbalism'::regnamespace ORDER BY conrelid,conname;
