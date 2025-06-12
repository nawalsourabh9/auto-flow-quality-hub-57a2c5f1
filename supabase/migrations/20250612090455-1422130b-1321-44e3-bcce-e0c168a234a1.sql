
-- Update the generate_next_recurring_task function to fix sequential counting and prevent duplicates
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
  expected_next_date DATE;
  period_end_date DATE;
  next_count INTEGER;
  frequency_abbrev TEXT;
  period_identifier TEXT;
  new_task_name TEXT;
  ist_now TIMESTAMP WITH TIME ZONE;
  existing_task_id UUID;
  days_since_completion INTEGER;
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
   
   RAISE NOTICE 'Found completed task: %, is_recurring: %, parent_task_id: %', completed_task.title, completed_task.is_recurring, completed_task.parent_task_id;
   
   -- If this is not a recurring task instance, exit
   IF completed_task.parent_task_id IS NULL AND completed_task.is_recurring = false THEN
     RAISE NOTICE 'Task is not recurring and has no parent. Exiting.';
     RETURN NULL;
   END IF;
   
   -- Get parent task details (either the completed task itself if it's the parent, or its parent)
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
   days_since_completion := current_date_val - completed_task.start_date;
   RAISE NOTICE 'Days since task start date: %', days_since_completion;
   
   -- Check if enough time has passed based on frequency to generate next task
   CASE parent_task.recurring_frequency
     WHEN 'daily' THEN 
       IF days_since_completion < 1 THEN
         RAISE NOTICE 'Not enough time passed for daily task (need 1 day, has %)', days_since_completion;
         RETURN NULL;
       END IF;
     WHEN 'weekly' THEN 
       IF days_since_completion < 7 THEN
         RAISE NOTICE 'Not enough time passed for weekly task (need 7 days, has %)', days_since_completion;
         RETURN NULL;
       END IF;
     WHEN 'bi-weekly' THEN 
       IF days_since_completion < 14 THEN
         RAISE NOTICE 'Not enough time passed for bi-weekly task (need 14 days, has %)', days_since_completion;
         RETURN NULL;
       END IF;
     WHEN 'monthly' THEN 
       IF days_since_completion < 28 THEN
         RAISE NOTICE 'Not enough time passed for monthly task (need 28 days, has %)', days_since_completion;
         RETURN NULL;
       END IF;
     WHEN 'quarterly' THEN 
       IF days_since_completion < 90 THEN
         RAISE NOTICE 'Not enough time passed for quarterly task (need 90 days, has %)', days_since_completion;
         RETURN NULL;
       END IF;
     WHEN 'annually' THEN 
       IF days_since_completion < 365 THEN
         RAISE NOTICE 'Not enough time passed for annual task (need 365 days, has %)', days_since_completion;
         RETURN NULL;
       END IF;
     ELSE 
       RAISE NOTICE 'Unknown frequency: %', parent_task.recurring_frequency;
       RETURN NULL;
   END CASE;

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
     RAISE NOTICE 'Next start date % is beyond parent end date %. Not generating.', next_start_date, parent_task.end_date;
     RETURN NULL;
   END IF;

   -- If the calculated next start date is beyond the implicit period end date, don't generate
   IF next_start_date > period_end_date THEN
     RAISE NOTICE 'Next start date % is beyond period end date %. Not generating.', next_start_date, period_end_date;
     RETURN NULL;
   END IF;
   
   -- Get the next sequential count - find the highest existing count for this parent and add 1
   SELECT COALESCE(MAX(recurrence_count_in_period), 0) + 1 
   INTO next_count
   FROM tasks 
   WHERE parent_task_id = parent_task.id;
   
   RAISE NOTICE 'Next sequential count will be: %', next_count;
   
   -- *** Enhanced Duplicate Check ***
   -- Check if a task with the same parent and next_count already exists
   SELECT id INTO existing_task_id
   FROM tasks
   WHERE parent_task_id = parent_task.id
     AND recurrence_count_in_period = next_count
   LIMIT 1;

   IF existing_task_id IS NOT NULL THEN
     RAISE NOTICE 'Duplicate task instance for parent % with count % already exists (ID: %). Skipping.', parent_task.id, next_count, existing_task_id;
     RETURN existing_task_id;
   END IF;
   -- *** End Enhanced Duplicate Check ***

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
   
   -- Get period identifier (3-letter month abbreviation or year)
   IF parent_task.recurring_frequency IN ('daily', 'weekly', 'bi-weekly') THEN
     period_identifier := TO_CHAR(current_date_val, 'Mon');
   ELSE -- monthly, quarterly, annually
     period_identifier := TO_CHAR(current_date_val, 'YYYY');
   END IF;
   
   -- Generate new task name with proper format using sequential count
   new_task_name := parent_task.original_task_name || ' (' || frequency_abbrev || next_count || '-' || period_identifier || ')';
   
   RAISE NOTICE 'Generated new task name: %', new_task_name;
   
   -- Calculate the due date for the new instance based on its start date and frequency
   new_due_date := public.calculate_due_date(next_start_date, parent_task.recurring_frequency);

   -- Create new task instance
   INSERT INTO tasks (
     title,
     description,
     department,
     priority,
     due_date,
     assignee,
     status,
     is_recurring,
     recurring_frequency,
     start_date,
     end_date,
     is_customer_related,
     customer_name,
     attachments_required,
     approval_status,
     parent_task_id,
     original_task_name,
     recurrence_count_in_period
   ) VALUES (
     new_task_name,
     parent_task.description,
     parent_task.department,
     parent_task.priority,
     new_due_date,
     parent_task.assignee,
     'not-started',
     false, -- Instance tasks are not recurring themselves
     NULL,
     next_start_date,
     NULL,
     parent_task.is_customer_related,
     parent_task.customer_name,
     parent_task.attachments_required,
     'approved',
     parent_task.id,
     parent_task.original_task_name,
     next_count
   ) RETURNING id INTO new_task_id;
   
   RAISE NOTICE 'Created new task instance with ID: %', new_task_id;
   
   -- Update parent task's last generated date
   UPDATE tasks 
   SET last_generated_date = current_date_val 
   WHERE id = parent_task.id;
   
   RAISE NOTICE 'Updated parent task last_generated_date to: %', current_date_val;
   
   RETURN new_task_id;
 END;
 $function$;
