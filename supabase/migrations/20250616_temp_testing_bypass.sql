-- Temporary bypass for testing recurring task automation
-- This removes authentication requirements for testing functions
-- WARNING: Only use in development environment

-- Make mark_tasks_overdue function accessible without authentication
ALTER FUNCTION public.mark_tasks_overdue() SECURITY DEFINER;

-- Make generate_next_recurring_task function accessible without authentication  
ALTER FUNCTION public.generate_next_recurring_task(uuid) SECURITY DEFINER;

-- Make run_task_automation function accessible without authentication
ALTER FUNCTION public.run_task_automation() SECURITY DEFINER;

-- Add a comment to track this is temporary
COMMENT ON FUNCTION public.mark_tasks_overdue() IS 'Temporarily set to SECURITY DEFINER for testing - remove in production';
COMMENT ON FUNCTION public.generate_next_recurring_task(uuid) IS 'Temporarily set to SECURITY DEFINER for testing - remove in production';
COMMENT ON FUNCTION public.run_task_automation() IS 'Temporarily set to SECURITY DEFINER for testing - remove in production';
