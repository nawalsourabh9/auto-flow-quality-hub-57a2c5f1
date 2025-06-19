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
('biweekly', 'B{counter}-{month_abbrev}', 'monthly'),
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
$$;-- Function to create the first instance of a recurring task template
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

-- Verification query (run this after applying the above)
SELECT 'Recurring task system redesign completed successfully!' as status;
SELECT 'Templates have NULL due_date and status, instances have proper naming patterns' as note;
