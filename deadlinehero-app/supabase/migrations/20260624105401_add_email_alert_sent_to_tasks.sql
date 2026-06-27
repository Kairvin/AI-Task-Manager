-- 1. Add email_alert_sent column to prevent duplicate emails
ALTER TABLE tasks ADD COLUMN email_alert_sent BOOLEAN DEFAULT false;

-- 2. Create the pg_cron job to call the edge function every 5 minutes
-- NOTE: Enable pg_net and pg_cron extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Replace 'YOUR_SUPABASE_PROJECT_REF' with your actual project ref in production,
-- or use the full deployed edge function URL.
-- This schedules a HTTP POST to the function every 5 minutes.
SELECT cron.schedule(
  'check-deadlines-job',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
        url:='https://uzxprkjqeonyyvexcgfe.supabase.co/functions/v1/check-deadlines',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY_HERE"}'::jsonb,
        body:='{}'::jsonb
    )
  $$
);
