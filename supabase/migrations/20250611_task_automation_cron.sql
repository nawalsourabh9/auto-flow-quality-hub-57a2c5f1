
-- Enable the pg_cron and pg_net extensions if not already enabled
-- Note: These may need to be enabled manually in the Supabase dashboard

-- Create a cron job to run task automation daily at 6:00 AM UTC
SELECT cron.schedule(
  'task-automation-daily',
  '0 6 * * *', -- Every day at 6:00 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://sibaigcaglcmhfhvrwol.supabase.co/functions/v1/task-automation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYmFpZ2NhZ2xjbWhmaHZyd29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwOTQxMjUsImV4cCI6MjA1OTY3MDEyNX0.glqXwvhDZ9jSEE81JimH1gt-jHgaYyIh0svj5Q07PZw"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);

-- Add indexes for better performance on recurring task queries
CREATE INDEX IF NOT EXISTS idx_tasks_recurring_automation 
ON public.tasks(is_recurring, recurring_frequency, start_date, end_date) 
WHERE is_recurring = true;

CREATE INDEX IF NOT EXISTS idx_tasks_overdue_check 
ON public.tasks(due_date, status) 
WHERE status != 'completed';

-- Add a function to manually trigger task automation (useful for testing)
CREATE OR REPLACE FUNCTION trigger_task_automation()
RETURNS void
LANGUAGE sql
AS $$
  SELECT
    net.http_post(
        url:='https://sibaigcaglcmhfhvrwol.supabase.co/functions/v1/task-automation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYmFpZ2NhZ2xjbWhmaHZyd29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwOTQxMjUsImV4cCI6MjA1OTY3MDEyNX0.glqXwvhDZ9jSEE81JimH1gt-jHgaYyIh0svj5Q07PZw"}'::jsonb,
        body:='{"manual": true}'::jsonb
    );
$$;
