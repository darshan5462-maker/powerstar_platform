-- ==============================================================================
-- 20261019000006_realtime_publication.sql
-- PowerStar Platform v2 — Realtime Sync Subscriptions
-- ==============================================================================

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
EXCEPTION WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.provider_locations;
EXCEPTION WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_locations;
EXCEPTION WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN OTHERS THEN null;
END $$;
