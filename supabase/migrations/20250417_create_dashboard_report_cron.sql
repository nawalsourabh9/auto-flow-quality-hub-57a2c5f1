
-- Enable the necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule a cron job to run daily at 21:00 (9 PM)
SELECT cron.schedule(
  'daily-dashboard-report',  -- unique job name
  '0 21 * * *',             -- cron schedule (21:00 every day)
  $$
  SELECT net.http_get(
    url:='https://sibaigcaglcmhfhvrwol.supabase.co/functions/v1/send-dashboard-report',
    headers:='{
      "Content-Type": "application/json",
      "Authorization": "Bearer ' || current_setting('app.settings.supabase_anon_key', true) || '"
    }'::jsonb
  ) AS request_id;
  $$
);

-- Store the Supabase anon key in a setting for the cron job to use
ALTER DATABASE postgres 
  SET app.settings.supabase_anon_key 
  TO 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYmFpZ2NhZ2xjbWhmaHZyd29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwOTQxMjUsImV4cCI6MjA1OTY3MDEyNX0.glqXwvhDZ9jSEE81JimH1gt-jHgaYyIh0svj5Q07PZw';
