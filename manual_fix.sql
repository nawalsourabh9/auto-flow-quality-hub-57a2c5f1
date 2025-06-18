-- MANUAL FIX: Copy and paste this SQL into your Supabase SQL Editor
-- This will create the missing functions needed for recurring task generation

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS complete_task_and_generate_next(UUID);
DROP FUNCTION IF EXISTS mark_tasks_overdue_simple();
DROP FUNCTION IF EXISTS generate_next_recurring_task(UUID);
DROP FUNCTION IF EXISTS test_recurring_system();

-- 1. Frontend completion function (FIXED)
CREATE OR REPLACE FUNCTION complete_task_and_generate_next(task_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    task_record tasks%ROWTYPE;
    new_task_id UUID;
    next_due_date DATE;
BEGIN
    SELECT * INTO task_record FROM tasks WHERE id = task_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Task not found', 'completed_task_id', task_id, 'new_recurring_task_id', null);
    END IF;
      -- FIRST: Mark the task as completed (if it isn't already)
    IF task_record.status != 'completed' THEN
        UPDATE tasks 
        SET status = 'completed'
        WHERE id = task_id;
        
        -- Refresh the task record to get updated status
        SELECT * INTO task_record FROM tasks WHERE id = task_id;
    END IF;
    
    -- THEN: Check if we should generate a recurring task
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
        IF next_due_date IS NOT NULL AND next_due_date <= CURRENT_DATE THEN
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
                parent_task_id, 
                start_date, 
                end_date, 
                is_customer_related, 
                customer_name, 
                attachments_required,
                approval_status,
                original_task_name,
                recurrence_count_in_period,
                created_at
            )
            VALUES (
                task_record.title,
                task_record.description,
                task_record.department,
                task_record.priority,
                next_due_date,
                task_record.assignee,
                'not-started',
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
                COALESCE(task_record.attachments_required, 'none'),
                'approved',
                COALESCE(task_record.original_task_name, task_record.title),
                COALESCE(task_record.recurrence_count_in_period, 1) + 1,
                NOW()
            )
            RETURNING id INTO new_task_id;
            
            RETURN jsonb_build_object('success', true, 'message', 'Task completed and new instance generated', 'completed_task_id', task_id, 'new_recurring_task_id', new_task_id);
        ELSE
            RETURN jsonb_build_object('success', true, 'message', 'Task completed, no new instance needed', 'completed_task_id', task_id, 'new_recurring_task_id', null);
        END IF;
    ELSE
        RETURN jsonb_build_object('success', true, 'message', 'Task completed, not recurring', 'completed_task_id', task_id, 'new_recurring_task_id', null);
    END IF;
    
EXCEPTION WHEN others THEN
    RETURN jsonb_build_object('success', false, 'message', 'Error: ' || SQLERRM, 'completed_task_id', task_id, 'new_recurring_task_id', null);
END;
$$;

-- 2. Overdue marking function (THE BUG FIX)
CREATE OR REPLACE FUNCTION mark_tasks_overdue_simple()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    affected_count INTEGER;
BEGIN    -- FIXED: Only mark not-started and in-progress tasks as overdue (never completed tasks)
    UPDATE tasks 
    SET status = 'overdue'
    WHERE due_date < CURRENT_DATE
      AND status IN ('not-started', 'in-progress')  -- KEY FIX: exclude completed tasks
      AND (is_recurring IS FALSE OR is_recurring IS NULL);
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$;

-- 3. Edge Function compatibility (for automation)
CREATE OR REPLACE FUNCTION generate_next_recurring_task(completed_task_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    task_record tasks%ROWTYPE;
    new_task_id UUID;
    next_due_date DATE;
BEGIN
    SELECT * INTO task_record FROM tasks WHERE id = completed_task_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Task not found', 'task_id', completed_task_id);
    END IF;
    
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
        END IF;          IF next_due_date IS NOT NULL AND next_due_date <= CURRENT_DATE THEN
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
                parent_task_id, 
                start_date, 
                end_date, 
                is_customer_related, 
                customer_name, 
                attachments_required,
                approval_status,
                original_task_name,
                recurrence_count_in_period,
                created_at
            )
            VALUES (
                task_record.title,
                task_record.description,
                task_record.department,
                task_record.priority,
                next_due_date,
                task_record.assignee,
                'not-started',
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
                COALESCE(task_record.attachments_required, 'none'),
                'approved',
                COALESCE(task_record.original_task_name, task_record.title),
                COALESCE(task_record.recurrence_count_in_period, 1) + 1,
                NOW()
            )
            RETURNING id INTO new_task_id;
            
            RETURN jsonb_build_object('success', true, 'message', 'Next recurring task created', 'task_id', new_task_id);
        ELSE
            RETURN jsonb_build_object('success', true, 'message', 'No new task needed', 'task_id', null);
        END IF;
    ELSE
        RETURN jsonb_build_object('success', true, 'message', 'Task is not recurring', 'task_id', null);
    END IF;
EXCEPTION WHEN others THEN
    RETURN jsonb_build_object('success', false, 'message', 'Error: ' || SQLERRM, 'task_id', null);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION complete_task_and_generate_next(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_tasks_overdue_simple() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_next_recurring_task(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_task_and_generate_next(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION mark_tasks_overdue_simple() TO service_role;
GRANT EXECUTE ON FUNCTION generate_next_recurring_task(UUID) TO service_role;

-- Verification query (run this after applying the above)
SELECT 'Functions created successfully!' as status;
