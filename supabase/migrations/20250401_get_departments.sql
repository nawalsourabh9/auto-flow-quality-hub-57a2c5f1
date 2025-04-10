
-- Create function to get all departments
CREATE OR REPLACE FUNCTION public.get_departments()
RETURNS TABLE (
  id UUID,
  name TEXT,
  created_at TIMESTAMPTZ
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT id, name, created_at
  FROM public.departments
  ORDER BY name ASC;
$$;
