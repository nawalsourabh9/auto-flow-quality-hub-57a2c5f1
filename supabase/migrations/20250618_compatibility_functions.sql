-- Compatibility functions for recurring task generation
-- This creates minimal functions needed for the system to work without full migration

-- First, create the complete_task_and_generate_next function that the frontend expects
CREATE OR REPLACE FUNCTION complete_task_and_generate_next(task_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    task_record tasks%ROWTYPE;
    new_task_id UUID;
    next_due_date DATE;
    result JSONB;
BEGIN
    -- Get the task details
    SELECT * INTO task_record
    FROM tasks 
    WHERE id = task_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Task not found',
            'completed_task_id', task_id,
            'new_recurring_task_id', null
        );
    END IF;
    
    -- If task is already completed, just return success
    IF task_record.status = 'completed' THEN
        -- Check if this should generate a recurring task
        IF task_record.is_recurring = true OR task_record.parent_task_id IS NOT NULL THEN
            -- Calculate next due date
            IF task_record.recurring_frequency = 'daily' THEN
                next_due_date := task_record.due_date + INTERVAL '1 day';
            ELSIF task_record.recurring_frequency = 'weekly' THEN
                next_due_date := task_record.due_date + INTERVAL '1 week';
            ELSIF task_record.recurring_frequency = 'biweekly' THEN
                next_due_date := task_record.due_date + INTERVAL '2 weeks';
            ELSIF task_record.recurring_frequency = 'monthly' THEN
                next_due_date := task_record.due_date + INTERVAL '1 month';
            ELSIF task_record.recurring_frequency = 'quarterly' THEN
                next_due_date := task_record.due_date + INTERVAL '3 months';
            ELSIF task_record.recurring_frequency = 'annually' THEN
                next_due_date := task_record.due_date + INTERVAL '1 year';
            ELSE
                next_due_date := NULL;
            END IF;
            
            -- Only create if we have a next due date and it's not in the future
            IF next_due_date IS NOT NULL AND next_due_date <= CURRENT_DATE THEN
                -- Create the next recurring task
                INSERT INTO tasks (
                    title,
                    description,
                    priority,
                    department,
                    assignee,
                    status,
                    due_date,
                    is_recurring,
                    recurring_frequency,
                    parent_task_id,
                    start_date,
                    end_date,
                    is_customer_related,
                    customer_name,
                    created_at,
                    updated_at
                ) VALUES (
                    task_record.title,
                    task_record.description,
                    task_record.priority,
                    task_record.department,
                    task_record.assignee,
                    'not-started',
                    next_due_date,
                    false, -- Child tasks are not recurring themselves
                    task_record.recurring_frequency,
                    CASE 
                        WHEN task_record.parent_task_id IS NOT NULL THEN task_record.parent_task_id
                        ELSE task_record.id
                    END,
                    task_record.start_date,
                    task_record.end_date,
                    task_record.is_customer_related,
                    task_record.customer_name,
                    NOW(),
                    NOW()
                ) RETURNING id INTO new_task_id;
                
                RETURN jsonb_build_object(
                    'success', true,
                    'message', 'Task completed and new instance generated',
                    'completed_task_id', task_id,
                    'new_recurring_task_id', new_task_id
                );
            ELSE
                RETURN jsonb_build_object(
                    'success', true,
                    'message', 'Task completed, no new instance needed',
                    'completed_task_id', task_id,
                    'new_recurring_task_id', null
                );
            END IF;
        ELSE
            RETURN jsonb_build_object(
                'success', true,
                'message', 'Task completed, not recurring',
                'completed_task_id', task_id,
                'new_recurring_task_id', null
            );
        END IF;
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Task is not completed',
            'completed_task_id', task_id,
            'new_recurring_task_id', null
        );
    END IF;
    
EXCEPTION WHEN others THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error: ' || SQLERRM,
        'completed_task_id', task_id,
        'new_recurring_task_id', null
    );
END;
$$;

-- Also create a simple overdue marking function
CREATE OR REPLACE FUNCTION mark_tasks_overdue_simple()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    -- Mark tasks as overdue only if they are not-started or in-progress
    -- and their due date has passed, but exclude recurring parent tasks
    UPDATE tasks 
    SET status = 'overdue',
        updated_at = NOW()
    WHERE due_date < CURRENT_DATE
      AND status IN ('not-started', 'in-progress')
      AND (is_recurring IS FALSE OR is_recurring IS NULL)
      AND (parent_task_id IS NOT NULL OR is_recurring IS FALSE);
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION complete_task_and_generate_next(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_tasks_overdue_simple() TO authenticated;
GRANT EXECUTE ON FUNCTION complete_task_and_generate_next(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION mark_tasks_overdue_simple() TO service_role;

-- Create a simple test function
CREATE OR REPLACE FUNCTION test_recurring_system()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    overdue_count INTEGER;
    result JSONB := jsonb_build_object();
BEGIN
    -- Mark overdue tasks
    SELECT mark_tasks_overdue_simple() INTO overdue_count;
    
    result := jsonb_build_object(
        'overdue_marked', overdue_count,
        'timestamp', NOW(),
        'status', 'completed'
    );
    
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION test_recurring_system() TO authenticated;
GRANT EXECUTE ON FUNCTION test_recurring_system() TO service_role;
