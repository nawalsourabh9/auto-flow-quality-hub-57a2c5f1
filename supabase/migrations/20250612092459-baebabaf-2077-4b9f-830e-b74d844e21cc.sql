
-- Create the missing calculate_due_date function that's needed for recurring task generation
CREATE OR REPLACE FUNCTION public.calculate_due_date(start_date date, frequency text)
RETURNS date
LANGUAGE plpgsql
AS $function$
BEGIN
  CASE frequency
    WHEN 'daily' THEN 
      RETURN start_date + INTERVAL '1 day';
    WHEN 'weekly' THEN 
      RETURN start_date + INTERVAL '7 days';
    WHEN 'bi-weekly' THEN 
      RETURN start_date + INTERVAL '14 days';
    WHEN 'monthly' THEN 
      RETURN start_date + INTERVAL '1 month';
    WHEN 'quarterly' THEN 
      RETURN start_date + INTERVAL '3 months';
    WHEN 'annually' THEN 
      RETURN start_date + INTERVAL '1 year';
    ELSE 
      -- Default to 1 day if frequency is unknown
      RETURN start_date + INTERVAL '1 day';
  END CASE;
END;
$function$;
