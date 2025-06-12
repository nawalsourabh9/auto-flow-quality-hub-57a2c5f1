
-- Add new columns to support the enhanced recurring task system
ALTER TABLE tasks 
ADD COLUMN parent_task_id UUID REFERENCES tasks(id),
ADD COLUMN original_task_name TEXT,
ADD COLUMN recurrence_count_in_period INTEGER DEFAULT 1,
ADD COLUMN last_generated_date DATE;

-- Create an index on parent_task_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);

-- Create an index on original_task_name for filtering
CREATE INDEX IF NOT EXISTS idx_tasks_original_task_name ON tasks(original_task_name);

-- Update the existing recurring task validation trigger to work with new schema
DROP TRIGGER IF EXISTS validate_recurring_task_dates_trigger ON tasks;

CREATE OR REPLACE FUNCTION validate_recurring_task_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate if it's a recurring task (parent task with recurrence settings)
  IF NEW.is_recurring = true AND NEW.parent_task_id IS NULL THEN
    -- Check if both start_date and end_date are provided for parent recurring tasks
    IF NEW.start_date IS NULL OR NEW.end_date IS NULL THEN
      RAISE EXCEPTION 'Both start_date and end_date are required for recurring tasks';
    END IF;
    
    -- Check if end_date is after start_date
    IF NEW.end_date <= NEW.start_date THEN
      RAISE EXCEPTION 'End date must be after start date for recurring tasks';
    END IF;
    
    -- Check if end_date is within 6 months of start_date
    DECLARE
        duration_interval INTERVAL;
        duration_days INTEGER;
    BEGIN
        duration_interval := NEW.end_date - NEW.start_date;
        duration_days := EXTRACT(DAY FROM duration_interval); -- Extract days from interval

        RAISE NOTICE 'Validating recurring task dates: duration_interval = %, duration_days = %', duration_interval, duration_days;

        IF duration_interval > INTERVAL '6 months' THEN
            RAISE EXCEPTION 'End date must be within 6 months of start date for recurring tasks (Duration: %)', duration_interval;
        END IF;
    END;
    
    -- Set original_task_name if not provided
    IF NEW.original_task_name IS NULL THEN
      NEW.original_task_name := NEW.title;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_recurring_task_dates_trigger
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION validate_recurring_task_dates();

-- Function to generate next recurring task instance
CREATE OR REPLACE FUNCTION generate_next_recurring_task(completed_task_id UUID)
RETURNS UUID AS $$
DECLARE
  completed_task RECORD;
  parent_task RECORD;
  new_task_id UUID;
  next_start_date DATE;
  current_date_val DATE := CURRENT_DATE;
  expected_next_date DATE;
  period_end_date DATE;
  current_count INTEGER;
  frequency_abbrev TEXT;
  period_identifier TEXT;
  new_task_name TEXT;
BEGIN
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
  
  -- If current date is before expected next date, don't generate yet
  IF current_date_val < expected_next_date THEN
    RETURN NULL;
  END IF;
  
  -- Use current date as start date for new task
  next_start_date := current_date_val;
  
  -- Calculate period end date based on frequency
  IF parent_task.recurring_frequency IN ('daily', 'weekly', 'bi-weekly') THEN
    period_end_date := DATE_TRUNC('month', current_date_val) + INTERVAL '1 month' - INTERVAL '1 day';
  ELSE
    period_end_date := DATE_TRUNC('year', current_date_val) + INTERVAL '1 year' - INTERVAL '1 day';
  END IF;
  
  -- If next start date is beyond the recurrence end date, don't generate
  IF next_start_date > parent_task.end_date THEN
    RETURN NULL;
  END IF;
  
  -- If next start date is beyond the period end date, don't generate
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
  
  -- Get period identifier
  IF parent_task.recurring_frequency IN ('daily', 'weekly', 'bi-weekly') THEN
    period_identifier := TO_CHAR(current_date_val, 'Month');
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
  
  -- Generate new task name
  new_task_name := parent_task.original_task_name || ' (' || frequency_abbrev || current_count || '-' || TRIM(period_identifier) || ')';
  
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
    next_start_date + INTERVAL '1 day', -- Due date is day after start
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
$$ LANGUAGE plpgsql;

-- Function to automatically generate recurring tasks when a task is completed
CREATE OR REPLACE FUNCTION handle_task_completion()
RETURNS TRIGGER AS $$
DECLARE
  new_task_id UUID;
BEGIN
  -- Only trigger when status changes to completed
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    -- Try to generate next recurring task
    SELECT generate_next_recurring_task(NEW.id) INTO new_task_id;
    
    IF new_task_id IS NOT NULL THEN
      -- Log the generation (you could also create a notifications entry here)
      RAISE NOTICE 'Generated new recurring task % for completed task %', new_task_id, NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic recurring task generation
CREATE TRIGGER handle_task_completion_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION handle_task_completion();
