-- Fix overdue marking logic and sync schema with current frontend/backend
-- This migration addresses the issue where completed/approved/rejected tasks are incorrectly marked as overdue
-- Date: 2025-06-18

-- First, let's ensure we have all the necessary columns for current frontend/backend compatibility
-- Add missing columns if they don't exist (these are safe to run multiple times)
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS is_recurring_parent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES public.tasks(id),
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS frequency TEXT,
ADD COLUMN IF NOT EXISTS series_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS series_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS assignee_id UUID,
ADD COLUMN IF NOT EXISTS department_id UUID,
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Safely populate the name column from title where name is null (idempotent)
UPDATE public.tasks SET name = title WHERE name IS NULL OR name = '';

-- Make name column not null only if it's currently nullable
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'name' 
        AND is_nullable = 'YES'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tasks ALTER COLUMN name SET NOT NULL;
    END IF;
END $$;

-- Copy recurring_frequency to frequency where available and frequency is null
UPDATE public.tasks 
SET frequency = recurring_frequency 
WHERE frequency IS NULL AND recurring_frequency IS NOT NULL;

-- Update status constraint to include all possible values (drop and recreate to ensure consistency)
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check 
CHECK (status IN (
    'not-started', 'in-progress', 'completed', 'overdue', 'cancelled', 'archived',
    'PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED', 'ARCHIVED',
    'pending', 'approved', 'rejected'
));

-- Ensure all necessary indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON public.tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_recurring_parent ON public.tasks(is_recurring_parent);
CREATE INDEX IF NOT EXISTS idx_tasks_series_dates ON public.tasks(series_start_date, series_end_date);
CREATE INDEX IF NOT EXISTS idx_tasks_frequency ON public.tasks(frequency);
CREATE INDEX IF NOT EXISTS idx_tasks_status_due_date ON public.tasks(status, due_date);

-- Create error logging table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.task_automation_error_log (
    id BIGSERIAL PRIMARY KEY,
    function_name TEXT NOT NULL,
    params JSONB,
    error_message TEXT,
    error_details TEXT,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- **FIX: Updated mark_tasks_overdue function with proper status exclusions**
CREATE OR REPLACE FUNCTION public.mark_tasks_overdue()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_current_time TIMESTAMPTZ := NOW();
    v_updated_count INTEGER := 0;
BEGIN
    -- Mark tasks as overdue, but EXCLUDE all final/completed states
    UPDATE public.tasks
    SET status = 'overdue'
    WHERE due_date < v_current_time
      AND status NOT IN (
          -- All possible completed/final statuses (case-insensitive coverage)
          'completed', 'cancelled', 'archived', 'approved', 'rejected',
          'COMPLETED', 'CANCELLED', 'ARCHIVED', 'APPROVED', 'REJECTED'
      )
      AND is_recurring_parent = FALSE;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;

EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO public.task_automation_error_log (function_name, params, error_message, error_details)
        VALUES ('mark_tasks_overdue', NULL, SQLERRM, 'SQLSTATE: ' || SQLSTATE);
        RETURN 0;
END;
$function$;

-- Updated create_pending_first_instances function compatible with current schema
CREATE OR REPLACE FUNCTION public.create_pending_first_instances()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_parent_record RECORD;
    v_instance_id UUID;
    v_created_count INTEGER := 0;
    v_errors_count INTEGER := 0;
    v_current_date TIMESTAMPTZ := NOW();
    v_result JSONB;
BEGIN
    -- Find parent tasks that should have their first instance created
    FOR v_parent_record IN
        SELECT p.id, p.name, COALESCE(p.series_start_date, p.start_date) as start_date
        FROM public.tasks p
        WHERE COALESCE(p.is_recurring_parent, p.is_recurring, FALSE) = TRUE
          AND COALESCE(p.series_start_date, p.start_date, v_current_date) <= v_current_date
          AND NOT EXISTS (
              SELECT 1 FROM public.tasks i 
              WHERE COALESCE(i.parent_task_id, i.recurring_parent_id) = p.id 
                AND COALESCE(i.is_recurring_parent, FALSE) = FALSE
          )
    LOOP
        -- Create first instance for this parent
        SELECT public.create_first_recurring_instance(v_parent_record.id) INTO v_instance_id;
        
        IF v_instance_id IS NOT NULL THEN
            v_created_count := v_created_count + 1;
        ELSE
            v_errors_count := v_errors_count + 1;
        END IF;
    END LOOP;

    v_result := jsonb_build_object(
        'created_count', v_created_count,
        'errors_count', v_errors_count,
        'processed_at', v_current_date
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO public.task_automation_error_log (function_name, params, error_message, error_details)
        VALUES ('create_pending_first_instances', NULL, SQLERRM, 'SQLSTATE: ' || SQLSTATE);
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Updated create_first_recurring_instance function
CREATE OR REPLACE FUNCTION public.create_first_recurring_instance(p_parent_task_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_parent_task RECORD;
    v_new_task_id UUID;
    v_instance_start_date TIMESTAMPTZ;
    v_instance_end_date TIMESTAMPTZ;
    v_instance_due_date TIMESTAMPTZ;
    v_instance_name TEXT;
    v_current_date TIMESTAMPTZ := NOW();
BEGIN
    -- Fetch parent task details with flexible column handling
    SELECT 
        *,
        COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid) as safe_org_id,
        COALESCE(assignee_id, assignee) as safe_assignee_id,
        COALESCE(department_id, department) as safe_department_id,
        COALESCE(created_by, '00000000-0000-0000-0000-000000000000'::uuid) as safe_created_by
    INTO v_parent_task
    FROM public.tasks
    WHERE id = p_parent_task_id 
      AND COALESCE(is_recurring_parent, is_recurring, FALSE) = TRUE;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Use series_start_date, start_date, or current date
    v_instance_start_date := COALESCE(v_parent_task.series_start_date, v_parent_task.start_date, v_current_date);
    v_instance_end_date := v_instance_start_date + INTERVAL '1 day';
    v_instance_due_date := COALESCE(v_parent_task.due_date::timestamptz, v_instance_end_date);

    -- Generate instance name
    v_instance_name := COALESCE(v_parent_task.name, v_parent_task.title, 'Recurring Task') || ' - Instance 1';    -- Insert the new task instance - handle both old and new schema column names
    -- Check if parent_task_id column exists, otherwise use recurring_parent_id
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='parent_task_id' AND table_schema='public') THEN
        INSERT INTO public.tasks (
            id, parent_task_id, organization_id, name, title, description, status, 
            assignee_id, assignee, department_id, department, start_date, end_date, due_date,
            is_recurring_parent, frequency, series_start_date, series_end_date,
            created_by, priority, attachments_required, is_recurring
        ) VALUES (
            gen_random_uuid(), p_parent_task_id, v_parent_task.safe_org_id, v_instance_name,
            v_instance_name, v_parent_task.description, 'not-started',
            v_parent_task.safe_assignee_id, v_parent_task.assignee, v_parent_task.safe_department_id, v_parent_task.department,
            v_instance_start_date, v_instance_end_date, v_instance_due_date,
            FALSE, NULL, NULL, NULL, v_parent_task.safe_created_by,
            COALESCE(v_parent_task.priority, 'medium'), COALESCE(v_parent_task.attachments_required, 'none'), FALSE
        ) RETURNING id INTO v_new_task_id;
    ELSE
        -- Fallback for old schema with recurring_parent_id
        INSERT INTO public.tasks (
            id, recurring_parent_id, organization_id, name, title, description, status, 
            assignee_id, assignee, department_id, department, start_date, end_date, due_date,
            is_recurring_parent, frequency, series_start_date, series_end_date,
            created_by, priority, attachments_required, is_recurring
        ) VALUES (
            gen_random_uuid(), p_parent_task_id, v_parent_task.safe_org_id, v_instance_name,
            v_instance_name, v_parent_task.description, 'not-started',
            v_parent_task.safe_assignee_id, v_parent_task.assignee, v_parent_task.safe_department_id, v_parent_task.department,
            v_instance_start_date, v_instance_end_date, v_instance_due_date,
            FALSE, NULL, NULL, NULL, v_parent_task.safe_created_by,
            COALESCE(v_parent_task.priority, 'medium'), COALESCE(v_parent_task.attachments_required, 'none'), FALSE
        ) RETURNING id INTO v_new_task_id;
    END IF;

    RETURN v_new_task_id;

EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO public.task_automation_error_log (function_name, params, error_message, error_details)
        VALUES ('create_first_recurring_instance', jsonb_build_object('p_parent_task_id', p_parent_task_id), SQLERRM, 'SQLSTATE: ' || SQLSTATE);
        RETURN NULL;
END;
$function$;

-- Updated run_task_automation function
CREATE OR REPLACE FUNCTION public.run_task_automation()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_overdue_count INTEGER;
    v_first_instances_result JSONB;
    v_result JSONB;
BEGIN
    -- Mark overdue tasks with the FIXED logic
    SELECT public.mark_tasks_overdue() INTO v_overdue_count;
    
    -- Create pending first instances
    SELECT public.create_pending_first_instances() INTO v_first_instances_result;
    
    v_result := jsonb_build_object(
        'overdue_count', v_overdue_count,
        'first_instances', v_first_instances_result,
        'executed_at', NOW(),
        'success', true
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO public.task_automation_error_log (function_name, params, error_message, error_details)
        VALUES ('run_task_automation', NULL, SQLERRM, 'SQLSTATE: ' || SQLSTATE);
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Create or replace the task completion trigger to work with current schema
CREATE OR REPLACE FUNCTION public.handle_task_completion()
RETURNS TRIGGER AS $function$
DECLARE
    new_task_id UUID;
BEGIN
    -- Only trigger when status changes to completed
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
        -- Try to generate next recurring task if this is a recurring task
        IF COALESCE(NEW.is_recurring, FALSE) = TRUE OR NEW.parent_task_id IS NOT NULL OR NEW.recurring_parent_id IS NOT NULL THEN
            -- Call the recurring task generation function if it exists
            BEGIN
                SELECT generate_next_recurring_task(NEW.id) INTO new_task_id;
                
                IF new_task_id IS NOT NULL THEN
                    -- Log the generation
                    RAISE NOTICE 'Generated new recurring task % for completed task %', new_task_id, NEW.id;
                END IF;
            EXCEPTION 
                WHEN undefined_function THEN
                    -- Function doesn't exist, skip silently
                    NULL;
                WHEN OTHERS THEN
                    -- Log error but don't fail the transaction
                    INSERT INTO public.task_automation_error_log (function_name, params, error_message, error_details)
                    VALUES ('handle_task_completion', jsonb_build_object('task_id', NEW.id), SQLERRM, 'SQLSTATE: ' || SQLSTATE);
            END;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$ LANGUAGE plpgsql;

-- Recreate trigger to ensure it exists
DROP TRIGGER IF EXISTS handle_task_completion_trigger ON public.tasks;
CREATE TRIGGER handle_task_completion_trigger
    AFTER UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_task_completion();

-- Add a manual test function to verify the fix
CREATE OR REPLACE FUNCTION public.test_overdue_fix()
RETURNS TABLE (
    task_id UUID,
    task_title TEXT,
    task_status TEXT,
    due_date TIMESTAMPTZ,
    would_be_marked_overdue BOOLEAN
) 
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.status,
        t.due_date,
        (t.due_date < NOW() AND t.status NOT IN (
            'completed', 'cancelled', 'archived', 'approved', 'rejected',
            'COMPLETED', 'CANCELLED', 'ARCHIVED', 'APPROVED', 'REJECTED'
        ) AND COALESCE(t.is_recurring_parent, FALSE) = FALSE) as would_be_marked_overdue
    FROM public.tasks t
    WHERE t.due_date < NOW()
    ORDER BY t.due_date DESC;
END;
$function$;

-- Add comment for tracking
COMMENT ON FUNCTION public.mark_tasks_overdue() IS 'Fixed 2025-06-18: Now properly excludes completed, approved, rejected, cancelled, and archived tasks from overdue marking';

-- Log the migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 20250618_fix_overdue_marking_and_sync_schema completed successfully';
    RAISE NOTICE 'Fixed: mark_tasks_overdue now excludes approved, rejected, cancelled, and archived tasks';
    RAISE NOTICE 'Added: Schema sync with current frontend/backend requirements';
    RAISE NOTICE 'Added: Error logging and test functions for debugging';
END $$;
