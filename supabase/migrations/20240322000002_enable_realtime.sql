DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'visits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE visits;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'active_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE active_sessions;
  END IF;
END $$;
