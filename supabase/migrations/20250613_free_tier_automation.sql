-- Remove cron dependency - make automation frontend-triggered
-- This version works on Supabase FREE tier

CREATE OR REPLACE FUNCTION public.generate_next_recurring_task(completed_task_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $function$
DECLARE
  completed_task RECORD;
  parent_task RECORD;
  new_task_id UUID;
  next_start_date DATE;
  new_due_date DATE;
  current_date_val DATE;
  period_end_date DATE;
  next_count INTEGER;
  frequency_abbrev TEXT;
  period_identifier TEXT;
  new_task_name TEXT;
  ist_now TIMESTAMP WITH TIME ZONE;
  existing_task_id UUID;
  days_since_start INTEGER;
  required_days_interval INTEGER;
BEGIN
  -- Get current IST time (UTC+5:30)
  ist_now := NOW() AT TIME ZONE 'UTC' + INTERVAL '5 hours 30 minutes';
  current_date_val := ist_now::DATE;
  
  RAISE NOTICE 'Starting task generation for completed_task_id: %, current IST date: %', completed_task_id, current_date_val;
  
  -- Get the completed task details
  SELECT * INTO completed_task FROM tasks WHERE id = completed_task_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found: %', completed_task_id;
  END IF;
  
  RAISE NOTICE 'Found completed task: %, is_recurring: %, parent_task_id: %, status: %', 
    completed_task.title, completed_task.is_recurring, completed_task.parent_task_id, completed_task.status;
  
  -- Only proceed if task is actually completed
  IF completed_task.status != 'completed' THEN
    RAISE NOTICE 'Task is not completed (status: %). Not generating new instance.', completed_task.status;
    RETURN NULL;
  END IF;
  
  -- If this is not a recurring task instance, exit
  IF completed_task.parent_task_id IS NULL AND completed_task.is_recurring = false THEN
    RAISE NOTICE 'Task is not recurring and has no parent. Exiting.';
    RETURN NULL;
  END IF;
  
  -- Get parent task details
  IF completed_task.parent_task_id IS NULL THEN
    parent_task := completed_task;
    RAISE NOTICE 'Completed task is the parent task';
  ELSE
    SELECT * INTO parent_task FROM tasks WHERE id = completed_task.parent_task_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Parent task not found: %', completed_task.parent_task_id;
    END IF;
    RAISE NOTICE 'Found parent task: %', parent_task.title;
  END IF;
  
  -- Calculate days since the completed task's start date
  days_since_start := EXTRACT(DAY FROM (current_date_val - completed_task.start_date))::INTEGER;
  RAISE NOTICE 'Days since task start date: %', days_since_start;
  
  -- Determine required interval based on frequency
  CASE parent_task.recurring_frequency
    WHEN 'daily' THEN required_days_interval := 1;
    WHEN 'weekly' THEN required_days_interval := 7;
    WHEN 'bi-weekly' THEN required_days_interval := 14;
    WHEN 'monthly' THEN required_days_interval := 30;
    WHEN 'quarterly' THEN required_days_interval := 90;
    WHEN 'annually' THEN required_days_interval := 365;
    ELSE 
      RAISE NOTICE 'Unknown frequency: %', parent_task.recurring_frequency;
      RETURN NULL;
  END CASE;
  
  -- Check if enough time has passed based on frequency
  IF days_since_start < required_days_interval THEN
    RAISE NOTICE 'Not enough time passed for % task (need % days, has % days)', 
      parent_task.recurring_frequency, required_days_interval, days_since_start;
    RETURN NULL;
  END IF;
  
  RAISE NOTICE 'Time requirement met: % days passed (needed %)', days_since_start, required_days_interval;
  
  -- Use current IST date as start date for new task
  next_start_date := current_date_val;
  
  -- Calculate period end date based on frequency
  IF parent_task.recurring_frequency IN ('daily', 'weekly', 'bi-weekly') THEN
    period_end_date := DATE_TRUNC('month', current_date_val) + INTERVAL '1 month' - INTERVAL '1 day';
  ELSE -- monthly, quarterly, annually
    period_end_date := DATE_TRUNC('year', current_date_val) + INTERVAL '1 year' - INTERVAL '1 day';
  END IF;
  
  -- If the calculated next start date is beyond the parent task's explicit end date, don't generate
  IF parent_task.end_date IS NOT NULL AND next_start_date > parent_task.end_date THEN
    RAISE NOTICE 'Next start date % is beyond parent explicit end date %. Not generating.', next_start_date, parent_task.end_date;
    RETURN NULL;
  END IF;

  -- Check for duplicates
  SELECT id INTO existing_task_id
  FROM tasks
  WHERE parent_task_id = parent_task.id
    AND start_date = next_start_date
  LIMIT 1;

  IF existing_task_id IS NOT NULL THEN
    RAISE NOTICE 'Duplicate task instance already exists (ID: %). Skipping.', existing_task_id;
    RETURN existing_task_id;
  END IF;

  -- Get frequency abbreviation
  CASE parent_task.recurring_frequency
    WHEN 'daily' THEN frequency_abbrev := 'D';
    WHEN 'weekly' THEN frequency_abbrev := 'W';
    WHEN 'bi-weekly' THEN frequency_abbrev := 'BW';
    WHEN 'monthly' THEN frequency_abbrev := 'M';
    WHEN 'quarterly' THEN frequency_abbrev := 'Q';
    WHEN 'annually' THEN frequency_abbrev := 'A';
    ELSE frequency_abbrev := 'R';
  END CASE;
  
  -- Get period identifier
  IF parent_task.recurring_frequency IN ('daily', 'weekly', 'bi-weekly') THEN
    period_identifier := TO_CHAR(current_date_val, 'Mon');
  ELSE
    period_identifier := TO_CHAR(current_date_val, 'YYYY');
  END IF;
  
  -- Get next sequential count
  SELECT COALESCE(MAX(recurrence_count_in_period), 0) + 1 
  INTO next_count
  FROM tasks 
  WHERE parent_task_id = parent_task.id
    AND (
          (parent_task.recurring_frequency IN ('daily', 'weekly', 'bi-weekly') 
           AND DATE_TRUNC('month', start_date) = DATE_TRUNC('month', current_date_val))
          OR 
          (parent_task.recurring_frequency IN ('monthly', 'quarterly', 'annually')
           AND DATE_TRUNC('year', start_date) = DATE_TRUNC('year', current_date_val))
        );
  
  -- Generate new task name
  new_task_name := parent_task.original_task_name || ' (' || frequency_abbrev || next_count || '-' || period_identifier || ')';
  
  -- Calculate due date
  new_due_date := public.calculate_due_date(next_start_date, parent_task.recurring_frequency);

  -- Create new task instance
  INSERT INTO tasks (
    title, description, department, priority, due_date, assignee, status,
    is_recurring, recurring_frequency, start_date, end_date,
    is_customer_related, customer_name, attachments_required, approval_status,
    parent_task_id, original_task_name, recurrence_count_in_period
  ) VALUES (
    new_task_name, parent_task.description, parent_task.department, parent_task.priority,
    new_due_date, parent_task.assignee, 'not-started', false, NULL, next_start_date, NULL,
    parent_task.is_customer_related, parent_task.customer_name, parent_task.attachments_required,
    'approved', parent_task.id, parent_task.original_task_name, next_count::INTEGER
  ) RETURNING id INTO new_task_id;
  
  -- Update parent task's last generated date
  UPDATE tasks SET last_generated_date = current_date_val WHERE id = parent_task.id;
  
  RETURN new_task_id;
END;
$function$;

-- Function to mark tasks overdue (frequency-aware)
CREATE OR REPLACE FUNCTION public.mark_tasks_overdue()
RETURNS INTEGER
LANGUAGE plpgsql
AS $function$
DECLARE
  updated_count INTEGER := 0;
  task_record RECORD;
  current_date_val DATE;
  ist_now TIMESTAMP WITH TIME ZONE;
  overdue_threshold_days INTEGER;
BEGIN
  ist_now := NOW() AT TIME ZONE 'UTC' + INTERVAL '5 hours 30 minutes';
  current_date_val := ist_now::DATE;
  
  FOR task_record IN
    SELECT t.id, t.title, t.due_date, t.status, 
           COALESCE(p.recurring_frequency, t.recurring_frequency) as frequency
    FROM tasks t
    LEFT JOIN tasks p ON t.parent_task_id = p.id
    WHERE t.status IN ('not-started', 'in-progress')
      AND t.due_date IS NOT NULL
      AND t.due_date < current_date_val
  LOOP
    -- Determine overdue threshold
    CASE task_record.frequency
      WHEN 'daily' THEN overdue_threshold_days := 1;
      WHEN 'weekly' THEN overdue_threshold_days := 7;
      WHEN 'bi-weekly' THEN overdue_threshold_days := 14;
      WHEN 'monthly' THEN overdue_threshold_days := 30;
      WHEN 'quarterly' THEN overdue_threshold_days := 90;
      WHEN 'annually' THEN overdue_threshold_days := 365;
      ELSE overdue_threshold_days := 1;
    END CASE;
    
    -- Check if beyond threshold
    IF current_date_val > (task_record.due_date + overdue_threshold_days) THEN
      UPDATE tasks SET status = 'overdue' WHERE id = task_record.id;
      updated_count := updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN updated_count;
END;
$function$;

-- Simple automation function (no cron dependency)
CREATE OR REPLACE FUNCTION public.run_task_automation()
RETURNS TEXT
LANGUAGE plpgsql
AS $function$
DECLARE
  overdue_count INTEGER;
  result_message TEXT;
BEGIN
  -- Mark overdue tasks
  SELECT public.mark_tasks_overdue() INTO overdue_count;
  
  result_message := 'Task automation completed. ' || overdue_count || ' tasks marked as overdue.';
  RETURN result_message;
END;
$function$;
