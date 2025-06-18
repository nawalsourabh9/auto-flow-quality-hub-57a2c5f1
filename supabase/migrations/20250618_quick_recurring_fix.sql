-- Quick fix to enable recurring task generation without database migration access
-- This creates the missing function that the Edge Function expects

-- Create the missing complete_task_and_generate_next function if it doesn't exist
CREATE OR REPLACE FUNCTION public.complete_task_and_generate_next(task_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task_record RECORD;
  new_task_id UUID;
  result JSONB := '{"success": false}'::jsonb;
BEGIN
  -- Get the task to complete
  SELECT * INTO task_record FROM public.tasks WHERE id = task_id;
  
  IF NOT FOUND THEN
    RETURN '{"success": false, "message": "Task not found"}'::jsonb;
  END IF;
  
  -- Only process if task is recurring or has parent
  IF task_record.is_recurring OR task_record.parent_task_id IS NOT NULL THEN
    -- Mark the task as completed if not already
    IF task_record.status != 'completed' THEN
      UPDATE public.tasks 
      SET status = 'completed', completed_at = NOW()
      WHERE id = task_id;
    END IF;
    
    -- Try to generate next recurring task
    BEGIN
      -- Call the existing function if it exists
      SELECT public.generate_next_recurring_task(task_id) INTO new_task_id;
      
      IF new_task_id IS NOT NULL THEN
        result := jsonb_build_object(
          'success', true,
          'message', 'Task completed and next instance generated',
          'new_recurring_task_id', new_task_id
        );
      ELSE
        result := jsonb_build_object(
          'success', true,
          'message', 'Task completed, no new instance needed'
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- If generation fails, at least mark as completed
      result := jsonb_build_object(
        'success', true,
        'message', 'Task completed, but next instance generation failed: ' || SQLERRM
      );
    END;
  ELSE
    -- Just mark as completed
    UPDATE public.tasks 
    SET status = 'completed', completed_at = NOW()
    WHERE id = task_id;
    
    result := jsonb_build_object(
      'success', true,
      'message', 'Non-recurring task completed'
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.complete_task_and_generate_next(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_task_and_generate_next(UUID) TO anon;

-- Comment for reference
COMMENT ON FUNCTION public.complete_task_and_generate_next(UUID) IS 'Wrapper function for completing tasks and generating next recurring instances';
