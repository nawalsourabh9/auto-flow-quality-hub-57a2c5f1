
-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS validate_recurring_task_dates_trigger ON public.tasks;
DROP FUNCTION IF EXISTS public.validate_recurring_task_dates();

-- Create a more intelligent validation function
CREATE OR REPLACE FUNCTION public.validate_recurring_task_dates()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only validate if it's a recurring task AND we're actually changing recurring-related fields
  IF NEW.is_recurring = true THEN
    -- For INSERT operations, always check
    -- For UPDATE operations, only check if recurring fields are being changed
    IF TG_OP = 'INSERT' OR 
       (TG_OP = 'UPDATE' AND (
         OLD.is_recurring != NEW.is_recurring OR
         OLD.start_date IS DISTINCT FROM NEW.start_date OR
         OLD.end_date IS DISTINCT FROM NEW.end_date OR
         OLD.recurring_frequency IS DISTINCT FROM NEW.recurring_frequency
       )) THEN
      
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
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER validate_recurring_task_dates_trigger
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION validate_recurring_task_dates();
