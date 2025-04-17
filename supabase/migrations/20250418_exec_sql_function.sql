
-- Function to execute SQL queries (only accessible to service_role)
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE query;
  result := '{"success": true}'::JSONB;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
  RETURN result;
END;
$$;

-- Secure the function
REVOKE ALL ON FUNCTION public.exec_sql FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exec_sql TO service_role;

-- Helper function to enable real-time on a table
CREATE OR REPLACE FUNCTION public.enable_realtime(table_name text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Set the table to REPLICA IDENTITY FULL
  EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', table_name);
  
  -- Add the table to the supabase_realtime publication
  EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
  
  result := jsonb_build_object(
    'success', true,
    'message', format('Real-time enabled for table %s', table_name)
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
  RETURN result;
END;
$$;

-- Secure the function
REVOKE ALL ON FUNCTION public.enable_realtime FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enable_realtime TO authenticated;
GRANT EXECUTE ON FUNCTION public.enable_realtime TO service_role;
