-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the timeout processing job to run every 30 minutes
-- We use a DO block to prevent errors if the job already exists (though cron.schedule updates if exists)
SELECT cron.schedule(
    'process_approval_timeouts_job', -- Job name
    '*/30 * * * *',                 -- Schedule (every 30 mins)
    'SELECT public.process_approval_timeouts()' -- Command
);
