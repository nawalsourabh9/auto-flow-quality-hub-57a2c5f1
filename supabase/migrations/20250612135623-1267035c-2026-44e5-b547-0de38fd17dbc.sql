
-- Restore the comprehensive recurring task system with proper business logic
-- First, drop the oversimplified functions
DROP TRIGGER IF EXISTS handle_task_completion_trigger ON tasks;
DROP FUNCTION IF EXISTS handle_task_completion();
DROP FUNCTION IF EXISTS generate_next_recurring_task(uuid);
DROP FUNCTION IF EXISTS calculate_due_date(date, text);

-- Recreate the proper calculate_due_date function with correct business logic
CREATE OR REPLACE FUNCTION public.calculate_due_date(start_date date, frequency text)
RETURNS date
LANGUAGE plpgsql
AS $$
DECLARE
    due_date date;
BEGIN
    CASE frequency
        WHEN 'daily' THEN
            -- Due date is the same day for daily tasks
            due_date := start_date;
        WHEN 'weekly' THEN
            -- Due date is 6 days after start date for weekly
            due_date := start_date + INTERVAL '6 days';
        WHEN 'bi-weekly' THEN
            -- Due date is 13 days after start date for bi-weekly
            due_date := start_date + INTERVAL '13 days';
        WHEN 'monthly' THEN
            -- Due date is the same day next month, capped at end of month
            due_date := (start_date + INTERVAL '1 month')::date;
            -- Adjust for end of month if original day was beyond next month's last day
            IF EXTRACT(DAY FROM due_date) <> EXTRACT(DAY FROM start_date) THEN
                due_date := (date_trunc('month', due_date) + INTERVAL '1 month - 1 day')::date;
            END IF;
        WHEN 'quarterly' THEN
            -- Due date is the same day 3 months later, capped at end of month
            due_date := (start_date + INTERVAL '3 months')::date;
            IF EXTRACT(DAY FROM due_date) <> EXTRACT(DAY FROM start_date) THEN
                due_date := (date_trunc('month', due_date) + INTERVAL '1 month - 1 day')::date;
            END IF;
        WHEN 'annually' THEN
            -- Due date is the same day next year, capped for leap year
            due_date := (start_date + INTERVAL '1 year')::date;
            IF EXTRACT(DAY FROM due_date) <> EXTRACT(DAY FROM start_date) THEN
                due_date := (date_trunc('month', due_date) + INTERVAL '1 month - 1 day')::date;
            END IF;
        ELSE
            -- Default to same day
            due_date := start_date;
    END CASE;
    RETURN due_date;
END;
$$;

-- Recreate the comprehensive generate_next_recurring_task function with all business logic
CREATE OR REPLACE FUNCTION public.generate_next_recurring_task(completed_task_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  completed_task RECORD;
  parent_task RECORD;
  new_task_id uuid;
  next_start_date date;
  new_due_date date;
  current_date_val date;
  expected_next_date date;
  period_end_date date;
  next_count integer;
  frequency_abbrev text;
  period_identifier text;
  new_task_name text;
  existing_task_id uuid;
  days_since_completion integer;
BEGIN
   -- Get current date
   current_date_val := CURRENT_DATE;
   
   -- Get the completed task details
   SELECT * INTO completed_task FROM tasks WHERE id = completed_task_id;
   
   IF NOT FOUND THEN
     RETURN NULL;
   END IF;
   
   -- If this is not a recurring task instance, exit
   IF completed_task.parent_task_id IS NULL AND completed_task.is_recurring = false THEN
     RETURN NULL;
   END IF;
   
   -- Get parent task details
   IF completed_task.parent_task_id IS NULL THEN
     parent_task := completed_task;
   ELSE
     SELECT * INTO parent_task FROM tasks WHERE id = completed_task.parent_task_id;
     IF NOT FOUND THEN
       RETURN NULL;
     END IF;
   END IF;
   
   -- Calculate days since the completed task's start date
   days_since_completion := current_date_val - completed_task.start_date;
   
   -- Check if enough time has passed based on frequency
   CASE parent_task.recurring_frequency
     WHEN 'daily' THEN 
       IF days_since_completion < 1 THEN
         RETURN NULL;
       END IF;
     WHEN 'weekly' THEN 
       IF days_since_completion < 7 THEN
         RETURN NULL;
       END IF;
     WHEN 'bi-weekly' THEN 
       IF days_since_completion < 14 THEN
         RETURN NULL;
       END IF;
     WHEN 'monthly' THEN 
       IF days_since_completion < 28 THEN
         RETURN NULL;
       END IF;
     WHEN 'quarterly' THEN 
       IF days_since_completion < 90 THEN
         RETURN NULL;
       END IF;
     WHEN 'annually' THEN 
       IF days_since_completion < 365 THEN
         RETURN NULL;
       END IF;
     ELSE 
       RETURN NULL;
   END CASE;

   -- Use current date as start date for new task
   next_start_date := current_date_val;
   
   -- Calculate period end date based on frequency
   IF parent_task.recurring_frequency IN ('daily', 'weekly', 'bi-weekly') THEN
     period_end_date := date_trunc('month', current_date_val) + INTERVAL '1 month - 1 day';
   ELSE -- monthly, quarterly, annually
     period_end_date := date_trunc('year', current_date_val) + INTERVAL '1 year - 1 day';
   END IF;

   -- Check end date constraints
   IF parent_task.end_date IS NOT NULL AND next_start_date > parent_task.end_date THEN
     RETURN NULL;
   END IF;

   IF next_start_date > period_end_date THEN
     RETURN NULL;
   END IF;
   
   -- Get next sequential count for this period (resets monthly/annually)
   SELECT COALESCE(MAX(recurrence_count_in_period), 0) + 1 
   INTO next_count
   FROM tasks 
   WHERE parent_task_id = parent_task.id
     AND (
           (parent_task.recurring_frequency IN ('daily', 'weekly', 'bi-weekly') 
            AND date_trunc('month', start_date) = date_trunc('month', current_date_val))
           OR 
           (parent_task.recurring_frequency IN ('monthly', 'quarterly', 'annually')
            AND date_trunc('year', start_date) = date_trunc('year', current_date_val))
         );
   
   -- Enhanced duplicate check
   SELECT id INTO existing_task_id
   FROM tasks
   WHERE parent_task_id = parent_task.id
     AND recurrence_count_in_period = next_count
   LIMIT 1;

   IF existing_task_id IS NOT NULL THEN
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
   
   -- Get period identifier (3-letter month abbreviation or year)
   IF parent_task.recurring_frequency IN ('daily', 'weekly', 'bi-weekly') THEN
     period_identifier := TO_CHAR(current_date_val, 'Mon');
   ELSE -- monthly, quarterly, annually
     period_identifier := TO_CHAR(current_date_val, 'YYYY');
   END IF;
   
   -- Generate new task name with proper format
   new_task_name := parent_task.original_task_name || ' (' || frequency_abbrev || next_count || '-' || period_identifier || ')';
   
   -- Calculate the due date for the new instance
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
     false,
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
   
   -- Update parent task's last generated date
   UPDATE tasks 
   SET last_generated_date = current_date_val 
   WHERE id = parent_task.id;
   
   RETURN new_task_id;
END;
$$;

-- Create the task completion trigger
CREATE OR REPLACE FUNCTION public.handle_task_completion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  new_task_id uuid;
BEGIN
  -- Only trigger when status changes to completed
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    -- Try to generate next recurring task
    SELECT generate_next_recurring_task(NEW.id) INTO new_task_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic recurring task generation
CREATE TRIGGER handle_task_completion_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION handle_task_completion();
