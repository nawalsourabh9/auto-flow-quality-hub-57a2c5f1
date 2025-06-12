-- Helper function to calculate the due date based on start date and frequency
CREATE OR REPLACE FUNCTION public.calculate_due_date(start_date DATE, frequency TEXT)
RETURNS DATE
LANGUAGE plpgsql
AS $$
DECLARE
    due_date DATE;
BEGIN
    CASE frequency
        WHEN 'daily' THEN
            due_date := start_date;
        WHEN 'weekly' THEN
            -- Assuming due date is 6 days after start date for weekly (e.g., start Mon, due Sun)
            due_date := start_date + INTERVAL '6 days';
        WHEN 'bi-weekly' THEN
            -- Assuming due date is 13 days after start date for bi-weekly
            due_date := start_date + INTERVAL '13 days';
        WHEN 'monthly' THEN
            -- Assuming due date is the same day next month, capped at end of month
            due_date := (start_date + INTERVAL '1 month')::DATE;
            -- Adjust for end of month if original day was beyond next month's last day
            IF EXTRACT(DAY FROM due_date) <> EXTRACT(DAY FROM start_date) THEN
                 due_date := (date_trunc('month', due_date) + INTERVAL '1 month - 1 day')::DATE;
            END IF;
        WHEN 'quarterly' THEN
            -- Assuming due date is the same day 3 months later, capped at end of month
            due_date := (start_date + INTERVAL '3 months')::DATE;
             IF EXTRACT(DAY FROM due_date) <> EXTRACT(DAY FROM start_date) THEN
                 due_date := (date_trunc('month', due_date) + INTERVAL '1 month - 1 day')::DATE;
            END IF;
        WHEN 'annually' THEN
            -- Assuming due date is the same day next year, capped for leap year
            due_date := (start_date + INTERVAL '1 year')::DATE;
             IF EXTRACT(DAY FROM due_date) <> EXTRACT(DAY FROM start_date) THEN
                 due_date := (date_trunc('month', due_date) + INTERVAL '1 month - 1 day')::DATE;
            END IF;
        ELSE
            -- Default to daily behavior or handle error
            due_date := start_date;
    END CASE;
    RETURN due_date;
END;
$$;

-- Update the generate_next_recurring_task function to use IST timezone and improved naming
CREATE OR REPLACE FUNCTION public.generate_next_recurring_task(completed_task_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
  completed_task RECORD;
  parent_task RECORD;
  new_task_id UUID;
  next_start_date DATE;
  new_due_date DATE; -- Variable for the calculated due date
  current_date_val DATE;
  expected_next_date DATE;
  period_end_date DATE;
  current_count INTEGER;
  frequency_abbrev TEXT;
  period_identifier TEXT;
  new_task_name TEXT;
  ist_now TIMESTAMP WITH TIME ZONE;
 BEGIN
   -- Get current IST time (UTC+5:30)
   ist_now := NOW() AT TIME ZONE 'UTC' + INTERVAL '5 hours 30 minutes';
   current_date_val := ist_now::DATE;
   
   -- Get the completed task details
   SELECT * INTO completed_task FROM tasks WHERE id = completed_task_id;
   
   IF NOT FOUND THEN
     RAISE EXCEPTION 'Task not found: %', completed_task_id;
   END IF;
   
   -- If this is not a recurring task instance, exit
   IF completed_task.parent_task_id IS NULL AND completed_task.is_recurring = false THEN
     RETURN NULL;
   END IF;
   
   -- Get parent task details (either the completed task itself if it's the parent, or its parent)
   IF completed_task.parent_task_id IS NULL THEN
     parent_task := completed_task;
   ELSE
     SELECT * INTO parent_task FROM tasks WHERE id = completed_task.parent_task_id;
     IF NOT FOUND THEN
       RAISE EXCEPTION 'Parent task not found: %', completed_task.parent_task_id;
     END IF;
   END IF;
   
   -- Calculate expected next start date based on frequency
   CASE parent_task.recurring_frequency
     WHEN 'daily' THEN expected_next_date := completed_task.start_date + INTERVAL '1 day';
     WHEN 'weekly' THEN expected_next_date := completed_task.start_date + INTERVAL '7 days';
     WHEN 'bi-weekly' THEN expected_next_date := completed_task.start_date + INTERVAL '14 days';
     WHEN 'monthly' THEN expected_next_date := completed_task.start_date + INTERVAL '1 month';
     WHEN 'quarterly' THEN expected_next_date := completed_task.start_date + INTERVAL '3 months';
     WHEN 'annually' THEN expected_next_date := completed_task.start_date + INTERVAL '1 year';
     ELSE RETURN NULL;
   END CASE;
   
   -- Determine the actual start date for the new instance.
   -- It should be the current date if the current date is on or after the expected next date based on frequency.
   IF current_date_val < expected_next_date THEN
     -- Not enough time has passed since the previous instance's start date based on frequency
     RETURN NULL;
   END IF;

   -- If current date is on or after the expected next date, the new task's start date is today
   next_start_date := current_date_val;

   -- Calculate implicit period end date based on frequency and the new instance's start date
   IF parent_task.recurring_frequency IN ('daily', 'weekly', 'bi-weekly') THEN
     period_end_date := DATE_TRUNC('month', next_start_date) + INTERVAL '1 month' - INTERVAL '1 day';
   ELSE -- monthly, quarterly, annually
     period_end_date := DATE_TRUNC('year', next_start_date) + INTERVAL '1 year' - INTERVAL '1 day';
   END IF;

   -- If the calculated next start date is beyond the parent task's explicit end date, don't generate
   IF parent_task.end_date IS NOT NULL AND next_start_date > parent_task.end_date THEN
     RETURN NULL;
   END IF;

   -- If the calculated next start date is beyond the implicit period end date, don't generate
   IF next_start_date > period_end_date THEN
     RETURN NULL;
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
   
   -- Get period identifier (3-letter month abbreviation or year)
   IF parent_task.recurring_frequency IN ('daily', 'weekly', 'bi-weekly') THEN
     period_identifier := TO_CHAR(current_date_val, 'Mon');
   ELSE
     period_identifier := TO_CHAR(current_date_val, 'YYYY');
   END IF;
   
   -- Get current count for this period
   SELECT COALESCE(MAX(recurrence_count_in_period), 0) + 1 
   INTO current_count
   FROM tasks 
   WHERE parent_task_id = parent_task.id
     AND ((parent_task.recurring_frequency IN ('daily', 'weekly', 'bi-weekly') 
           AND DATE_TRUNC('month', start_date) = DATE_TRUNC('month', current_date_val))
          OR (parent_task.recurring_frequency IN ('monthly', 'quarterly', 'annually')
           AND DATE_TRUNC('year', start_date) = DATE_TRUNC('year', current_date_val)));
   
   -- Generate new task name with proper format
   new_task_name := parent_task.original_task_name || ' (' || frequency_abbrev || current_count || '-' || period_identifier || ')';
   
   -- Calculate the due date for the new instance based on its start date and frequency
   new_due_date := public.calculate_due_date(next_start_date, parent_task.recurring_frequency);

   -- Create new task instance
   INSERT INTO tasks (
     title,
     description,
     department,
     priority,
     due_date, -- Use the calculated new_due_date
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
     new_due_date, -- Use the calculated new_due_date
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
     current_count
   ) RETURNING id INTO new_task_id;
   
   -- Update parent task's last generated date
   UPDATE tasks 
   SET last_generated_date = current_date_val 
   WHERE id = parent_task.id;
   
   RETURN new_task_id;
 END;
 $function$;
