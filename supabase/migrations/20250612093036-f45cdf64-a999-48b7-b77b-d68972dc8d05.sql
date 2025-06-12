
-- Fix the calculate_due_date function to ensure it returns proper dates
CREATE OR REPLACE FUNCTION public.calculate_due_date(start_date date, frequency text)
RETURNS date
LANGUAGE plpgsql
AS $function$
BEGIN
  CASE frequency
    WHEN 'daily' THEN 
      RETURN start_date + 1;
    WHEN 'weekly' THEN 
      RETURN start_date + 7;
    WHEN 'bi-weekly' THEN 
      RETURN start_date + 14;
    WHEN 'monthly' THEN 
      RETURN (start_date + INTERVAL '1 month')::date;
    WHEN 'quarterly' THEN 
      RETURN (start_date + INTERVAL '3 months')::date;
    WHEN 'annually' THEN 
      RETURN (start_date + INTERVAL '1 year')::date;
    ELSE 
      -- Default to 1 day if frequency is unknown
      RETURN start_date + 1;
  END CASE;
END;
$function$;
