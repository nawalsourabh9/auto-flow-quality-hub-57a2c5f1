
-- Add missing columns to the tasks table for recurring task functionality
ALTER TABLE public.tasks 
ADD COLUMN start_date timestamp with time zone,
ADD COLUMN end_date timestamp with time zone,
ADD COLUMN recurring_parent_id uuid;

-- Add foreign key constraint for recurring_parent_id to reference the parent task
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_recurring_parent_id_fkey 
FOREIGN KEY (recurring_parent_id) REFERENCES public.tasks(id) ON DELETE CASCADE;

-- Add index for better performance when querying recurring tasks
CREATE INDEX idx_tasks_recurring_parent_id ON public.tasks(recurring_parent_id);

-- Add a check constraint to ensure end_date is after start_date for recurring tasks
-- Using a trigger instead of CHECK constraint to avoid immutability issues
CREATE OR REPLACE FUNCTION validate_recurring_task_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate if it's a recurring task
  IF NEW.is_recurring = true THEN
    -- Check if both start_date and end_date are provided
    IF NEW.start_date IS NULL OR NEW.end_date IS NULL THEN
      RAISE EXCEPTION 'Both start_date and end_date are required for recurring tasks';
    END IF;
    
    -- Check if end_date is after start_date
    IF NEW.end_date <= NEW.start_date THEN
      RAISE EXCEPTION 'End date must be after start date for recurring tasks';
    END IF;
    
    -- Check if end_date is within 6 months of start_date
    IF NEW.end_date > NEW.start_date + INTERVAL '6 months' THEN
      RAISE EXCEPTION 'End date must be within 6 months of start date for recurring tasks';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate recurring task dates
CREATE TRIGGER validate_recurring_task_dates_trigger
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION validate_recurring_task_dates();
