
-- Update the generate_next_recurring_task function to use 3-letter month abbreviations
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
  
  -- Get period identifier with 3-letter month abbreviations
  IF parent_task.recurring_frequency IN ('daily', 'weekly', 'bi-weekly') THEN
    period_identifier := TO_CHAR(current_date_val, 'Mon'); -- 3-letter month abbreviation
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
  
  -- Generate new task name with 3-letter month abbreviation
  new_task_name := parent_task.original_task_name || ' (' || frequency_abbrev || current_count || '-' || period_identifier || ')';
  
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
