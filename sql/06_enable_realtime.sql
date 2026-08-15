-- Enable realtime on all required tables
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE providers;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Verify
SELECT tablename FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
