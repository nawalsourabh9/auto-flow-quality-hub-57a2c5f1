-- MANUAL FIX: Complete recurring task system redesign
-- Copy and paste this SQL into your Supabase SQL Editor
-- This implements the full redesign for recurring tasks with templates and instances

-- Part 1: Schema Changes (run these first)
-- Make due_date and status nullable for templates
ALTER TABLE tasks 
ALTER COLUMN due_date DROP NOT NULL,
ALTER COLUMN status DROP NOT NULL;

-- Add new columns for the redesigned system
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS is_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create recurring naming rules table
CREATE TABLE IF NOT EXISTS recurring_naming_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    frequency TEXT NOT NULL,
    naming_pattern TEXT NOT NULL,
    counter_reset_frequency TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default naming rules
INSERT INTO recurring_naming_rules (frequency, naming_pattern, counter_reset_frequency) VALUES
('daily', 'D{counter}-{month_abbrev}', 'monthly'),
('weekly', 'W{counter}-{month_abbrev}', 'monthly'),
('bi-weekly', 'BW{counter}-{month_abbrev}', 'monthly'),
('monthly', 'M{counter}-{year}', 'yearly'),
('quarterly', 'Q{counter}-{year}', 'yearly'),
('annually', 'Y{counter}-{year}', 'yearly')
ON CONFLICT DO NOTHING;

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS complete_task_and_generate_next(UUID);
DROP FUNCTION IF EXISTS mark_tasks_overdue_simple();
DROP FUNCTION IF EXISTS generate_next_recurring_task(UUID);
DROP FUNCTION IF EXISTS test_recurring_system();
DROP FUNCTION IF EXISTS get_month_abbrev(DATE);
DROP FUNCTION IF EXISTS calculate_recurring_counter(UUID, TEXT, DATE);
DROP FUNCTION IF EXISTS generate_instance_name(TEXT, TEXT, DATE);
DROP FUNCTION IF EXISTS create_first_recurring_instance(UUID);
DROP FUNCTION IF EXISTS update_template_name_cascade(UUID, TEXT);

-- Part 2: Helper Functions

-- Function to get month abbreviation
CREATE OR REPLACE FUNCTION get_month_abbrev(date_input DATE)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN CASE EXTRACT(month FROM date_input)
        WHEN 1 THEN 'Jan'
        WHEN 2 THEN 'Feb' 
        WHEN 3 THEN 'Mar'
        WHEN 4 THEN 'Apr'
        WHEN 5 THEN 'May'
        WHEN 6 THEN 'Jun'
        WHEN 7 THEN 'Jul'
        WHEN 8 THEN 'Aug'
        WHEN 9 THEN 'Sep'
        WHEN 10 THEN 'Oct'
        WHEN 11 THEN 'Nov'
        WHEN 12 THEN 'Dec'
    END;
END;
$$;

-- Function to calculate counter for recurring tasks with reset logic
CREATE OR REPLACE FUNCTION calculate_recurring_counter(
    template_id UUID,
    frequency TEXT,
    target_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    counter INTEGER := 1;
    reset_frequency TEXT;
    start_of_period DATE;
BEGIN
    -- Get the reset frequency for this recurrence type
    SELECT counter_reset_frequency INTO reset_frequency
    FROM recurring_naming_rules 
    WHERE recurring_naming_rules.frequency = calculate_recurring_counter.frequency;
    
    IF reset_frequency IS NULL THEN
        reset_frequency := 'yearly'; -- Default fallback
    END IF;
    
    -- Calculate the start of the current period based on reset frequency
    IF reset_frequency = 'monthly' THEN
        start_of_period := DATE_TRUNC('month', target_date);
    ELSE -- yearly
        start_of_period := DATE_TRUNC('year', target_date);
    END IF;
    
    -- Count existing instances in this period for this template
    SELECT COUNT(*) + 1 INTO counter
    FROM tasks 
    WHERE (parent_task_id = template_id OR id = template_id)
      AND due_date >= start_of_period
      AND due_date < CASE 
          WHEN reset_frequency = 'monthly' THEN start_of_period + INTERVAL '1 month'
          ELSE start_of_period + INTERVAL '1 year'
      END
      AND COALESCE(is_template, FALSE) = FALSE;
    
    RETURN counter;
END;
$$;

-- Updated overdue marking function (excludes templates and completed tasks)
CREATE OR REPLACE FUNCTION mark_tasks_overdue_simple()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_count INTEGER := 0;
BEGIN
    -- Mark tasks as overdue ONLY if they are:
    -- 1. Not templates (is_template = FALSE or NULL)
    -- 2. Not completed
    -- 3. Past due date
    -- 4. Currently not-started or in-progress
    UPDATE tasks
    SET status = 'overdue', updated_at = NOW()
    WHERE due_date < CURRENT_DATE
      AND status IN ('not-started', 'in-progress')
      AND COALESCE(is_template, FALSE) = FALSE;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RAISE NOTICE 'Marked % tasks as overdue (excluding templates and completed tasks)', v_updated_count;
    
    RETURN v_updated_count;
END;
$$;

-- Function to create the first instance of a recurring task template
CREATE OR REPLACE FUNCTION create_first_recurring_instance(template_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    template_record tasks%ROWTYPE;
    instance_id UUID;
    instance_name TEXT;
    first_due_date DATE;
    counter INTEGER;
    naming_pattern TEXT;
BEGIN
    -- Get template details
    SELECT * INTO template_record FROM tasks WHERE id = template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template task not found: %', template_id;
    END IF;
    
    IF NOT template_record.is_recurring THEN
        RAISE EXCEPTION 'Task is not a recurring template: %', template_id;
    END IF;
    
    -- Calculate first due date (use start_date if provided, otherwise current date)
    IF template_record.start_date IS NOT NULL THEN
        first_due_date := template_record.start_date;
    ELSE
        first_due_date := CURRENT_DATE;
    END IF;
    
    -- Calculate counter for this instance
    counter := calculate_recurring_counter(template_id, template_record.recurring_frequency, first_due_date);
    
    -- Get naming pattern
    SELECT rnr.naming_pattern INTO naming_pattern
    FROM recurring_naming_rules rnr
    WHERE rnr.frequency = template_record.recurring_frequency;
    
    IF naming_pattern IS NULL THEN
        naming_pattern := '{counter}'; -- Simple fallback
    END IF;
    
    -- Generate instance name
    instance_name := template_record.title || ' (' || 
        REPLACE(
            REPLACE(
                REPLACE(naming_pattern, '{counter}', counter::TEXT),
                '{month_abbrev}', get_month_abbrev(first_due_date)
            ),
            '{year}', EXTRACT(year FROM first_due_date)::TEXT
        ) || ')';
    
    -- Create the first instance
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
        is_generated,
        is_template,
        created_at,
        updated_at
    )
    VALUES (
        instance_name,
        template_record.description,
        template_record.department,
        template_record.priority,
        first_due_date,
        template_record.assignee,
        'not-started',
        FALSE, -- Instances are not recurring themselves
        template_record.recurring_frequency,
        template_id,
        template_record.start_date,
        template_record.end_date,
        template_record.is_customer_related,
        template_record.customer_name,
        COALESCE(template_record.attachments_required, 'none'),
        'approved',
        template_record.title,
        counter,
        TRUE, -- Mark as generated
        FALSE, -- Not a template
        NOW(),
        NOW()
    )
    RETURNING id INTO instance_id;
    
    RETURN instance_id;
END;
$$;

-- Function to calculate next due date based on frequency
CREATE OR REPLACE FUNCTION calculate_next_due_date(
    current_due_date DATE,
    frequency TEXT
)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN CASE frequency
        WHEN 'daily' THEN current_due_date + INTERVAL '1 day'
        WHEN 'weekly' THEN current_due_date + INTERVAL '1 week'
        WHEN 'bi-weekly' THEN current_due_date + INTERVAL '2 weeks'
        WHEN 'monthly' THEN current_due_date + INTERVAL '1 month'
        WHEN 'quarterly' THEN current_due_date + INTERVAL '3 months'
        WHEN 'annually' THEN current_due_date + INTERVAL '1 year'
        ELSE current_due_date + INTERVAL '1 week' -- Default fallback
    END;
END;
$$;

-- Function to complete a task and generate the next instance if needed
CREATE OR REPLACE FUNCTION complete_task_and_generate_next(task_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    task_record tasks%ROWTYPE;
    template_record tasks%ROWTYPE;
    next_due_date DATE;
    next_instance_id UUID;
    instance_name TEXT;
    counter INTEGER;
    naming_pattern TEXT;
    result JSON;
BEGIN
    -- Get the task being completed
    SELECT * INTO task_record FROM tasks WHERE id = task_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Task not found');
    END IF;
    
    -- Prevent templates from being completed
    IF COALESCE(task_record.is_template, FALSE) = TRUE THEN
        RETURN json_build_object('success', false, 'error', 'Cannot complete template tasks');
    END IF;
    
    -- Mark the task as completed
    UPDATE tasks 
    SET status = 'completed', updated_at = NOW()
    WHERE id = task_id;
    
    -- If this is not a recurring task instance, just return success
    IF task_record.parent_task_id IS NULL THEN
        RETURN json_build_object('success', true, 'message', 'Task completed (not recurring)');
    END IF;
    
    -- Get the template
    SELECT * INTO template_record FROM tasks WHERE id = task_record.parent_task_id;
    
    IF NOT FOUND OR NOT template_record.is_recurring THEN
        RETURN json_build_object('success', true, 'message', 'Task completed (no valid template)');
    END IF;
    
    -- Check if we should generate the next instance
    -- Only generate if no other instance already exists for the next period
    next_due_date := calculate_next_due_date(task_record.due_date, template_record.recurring_frequency);
    
    -- Check if there's already an instance for this next period
    IF EXISTS (
        SELECT 1 FROM tasks 
        WHERE parent_task_id = template_record.id
          AND due_date = next_due_date
          AND COALESCE(is_template, FALSE) = FALSE
    ) THEN
        RETURN json_build_object('success', true, 'message', 'Task completed (next instance already exists)');
    END IF;
    
    -- Calculate counter for the next instance
    counter := calculate_recurring_counter(template_record.id, template_record.recurring_frequency, next_due_date);
    
    -- Get naming pattern
    SELECT rnr.naming_pattern INTO naming_pattern
    FROM recurring_naming_rules rnr
    WHERE rnr.frequency = template_record.recurring_frequency;
    
    IF naming_pattern IS NULL THEN
        naming_pattern := '{counter}'; -- Simple fallback
    END IF;
    
    -- Generate instance name
    instance_name := template_record.title || ' (' || 
        REPLACE(
            REPLACE(
                REPLACE(naming_pattern, '{counter}', counter::TEXT),
                '{month_abbrev}', get_month_abbrev(next_due_date)
            ),
            '{year}', EXTRACT(year FROM next_due_date)::TEXT
        ) || ')';
    
    -- Create the next instance
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
        is_generated,
        is_template,
        created_at,
        updated_at
    )
    VALUES (
        instance_name,
        template_record.description,
        template_record.department,
        template_record.priority,
        next_due_date,
        template_record.assignee,
        'not-started',
        FALSE,
        template_record.recurring_frequency,
        template_record.id,
        template_record.start_date,
        template_record.end_date,
        template_record.is_customer_related,
        template_record.customer_name,
        COALESCE(template_record.attachments_required, 'none'),
        'approved',
        template_record.title,
        counter,
        TRUE,
        FALSE,
        NOW(),
        NOW()
    )
    RETURNING id INTO next_instance_id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Task completed and next instance created',
        'new_recurring_task_id', next_instance_id
    );
END;
$$;

-- Function to update template name and cascade to all instances
CREATE OR REPLACE FUNCTION update_template_name_cascade(
    template_id UUID,
    new_name TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Update the template
    UPDATE tasks 
    SET title = new_name, updated_at = NOW()
    WHERE id = template_id AND COALESCE(is_template, FALSE) = TRUE;
    
    -- Update all instances to use the new base name while preserving their specific naming
    UPDATE tasks 
    SET original_task_name = new_name, updated_at = NOW()
    WHERE parent_task_id = template_id AND COALESCE(is_template, FALSE) = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count;
END;
$$;

-- Function to get overdue tasks (excludes templates and completed tasks)
CREATE OR REPLACE FUNCTION get_overdue_tasks()
RETURNS TABLE (
    id UUID,
    title TEXT,
    due_date DATE,
    status TEXT,
    assignee TEXT,
    department TEXT,
    priority TEXT,
    is_template BOOLEAN,
    days_overdue INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.due_date,
        t.status,
        t.assignee,
        t.department,
        t.priority,
        COALESCE(t.is_template, FALSE) as is_template,
        (CURRENT_DATE - t.due_date)::INTEGER as days_overdue
    FROM tasks t
    WHERE t.due_date < CURRENT_DATE
      AND t.status NOT IN ('completed', 'overdue')
      AND COALESCE(t.is_template, FALSE) = FALSE
    ORDER BY t.due_date ASC;
END;
$$;

-- Function for testing the recurring system
CREATE OR REPLACE FUNCTION test_recurring_system()
RETURNS TABLE (
    test_name TEXT,
    result TEXT,
    details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    template_count INTEGER;
    instance_count INTEGER;
    overdue_count INTEGER;
BEGIN
    -- Test 1: Count templates
    SELECT COUNT(*) INTO template_count 
    FROM tasks 
    WHERE COALESCE(is_template, FALSE) = TRUE;
    
    RETURN QUERY SELECT 
        'Template Count'::TEXT,
        template_count::TEXT,
        'Number of recurring task templates'::TEXT;
    
    -- Test 2: Count instances
    SELECT COUNT(*) INTO instance_count 
    FROM tasks 
    WHERE COALESCE(is_template, FALSE) = FALSE 
      AND parent_task_id IS NOT NULL;
    
    RETURN QUERY SELECT 
        'Instance Count'::TEXT,
        instance_count::TEXT,
        'Number of recurring task instances'::TEXT;
    
    -- Test 3: Count overdue tasks (excluding templates)
    SELECT COUNT(*) INTO overdue_count 
    FROM tasks 
    WHERE due_date < CURRENT_DATE
      AND status NOT IN ('completed', 'overdue')
      AND COALESCE(is_template, FALSE) = FALSE;
    
    RETURN QUERY SELECT 
        'Overdue Tasks'::TEXT,
        overdue_count::TEXT,
        'Non-template tasks that are overdue'::TEXT;
    
    -- Test 4: Check naming rules
    RETURN QUERY SELECT 
        'Naming Rules'::TEXT,
        COUNT(*)::TEXT,
        'Available naming rule patterns'::TEXT
    FROM recurring_naming_rules;
END;
$$;

-- Function to send overdue notifications (placeholder - adjust based on your notification system)
CREATE OR REPLACE FUNCTION send_overdue_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_count INTEGER := 0;
    overdue_task RECORD;
BEGIN
    -- Find overdue tasks that need notifications
    FOR overdue_task IN 
        SELECT t.id, t.title, t.assignee, t.due_date, t.department
        FROM tasks t
        WHERE t.due_date < CURRENT_DATE
          AND t.status NOT IN ('completed', 'overdue')
          AND COALESCE(t.is_template, FALSE) = FALSE
          AND t.assignee IS NOT NULL
    LOOP
        -- Here you would integrate with your notification system
        -- For now, we'll just count the notifications that would be sent
        notification_count := notification_count + 1;
        
        -- You could add logic here to:
        -- 1. Insert into a notifications table
        -- 2. Call an external API
        -- 3. Queue an email
        -- 4. Update task status to include notification sent flag
        
        RAISE NOTICE 'Would send notification for task % to %', overdue_task.title, overdue_task.assignee;
    END LOOP;
    
    RETURN notification_count;
END;
$$;

-- Comments for next steps and usage
/*
RECURRING TASK SYSTEM - USAGE INSTRUCTIONS:

1. MIGRATING EXISTING TASKS TO TEMPLATES:
   - Run this manual fix to add new columns and functions
   - Identify existing recurring tasks that should become templates
   - Update them: UPDATE tasks SET is_template = TRUE, due_date = NULL, status = NULL WHERE [conditions]

2. CREATING NEW RECURRING TASKS:
   - Create as template: INSERT with is_template = TRUE, is_recurring = TRUE, due_date = NULL, status = NULL
   - Generate first instance: SELECT create_first_recurring_instance(template_id)

3. COMPLETING TASKS:
   - Use: SELECT complete_task_and_generate_next(instance_id)
   - This completes the current instance and creates the next one automatically

4. TESTING THE SYSTEM:
   - Run: SELECT * FROM test_recurring_system()
   - Check overdue: SELECT * FROM get_overdue_tasks()
   - Mark overdue: SELECT mark_tasks_overdue_simple()

5. MANAGING TEMPLATES:
   - Update template name: SELECT update_template_name_cascade(template_id, 'New Name')
   - This updates the template and all its instances

6. CUSTOMIZING NAMING RULES:
   - Update patterns in recurring_naming_rules table
   - Available placeholders: {counter}, {month_abbrev}, {year}
   - Reset frequencies: 'monthly' or 'yearly'
*/

-- Verification query (run this after applying the above)
SELECT 'Recurring task system redesign completed successfully!' as status;
SELECT 'Templates have NULL due_date and status, instances have proper naming patterns' as note;
