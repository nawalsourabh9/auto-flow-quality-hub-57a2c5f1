-- =====================================================================
-- COMPLETE RECURRING TASK SYSTEM SETUP
-- =====================================================================
-- This is a consolidated script that includes all the changes made
-- Run this entire script in your Supabase SQL Editor to set up the 
-- complete recurring task system with bi-weekly pattern fixes
-- =====================================================================

-- PART 1: SCHEMA SETUP (manual_fix.sql content with bi-weekly updates)
-- =====================================================================

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

-- Insert default naming rules (with correct bi-weekly pattern)
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
DROP FUNCTION IF EXISTS calculate_next_due_date(DATE, TEXT);
DROP FUNCTION IF EXISTS calculate_next_due_date(TIMESTAMPTZ, TEXT);

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
    
    -- Count existing instances in this period
    SELECT COALESCE(MAX(recurrence_count_in_period), 0) + 1 INTO counter
    FROM tasks 
    WHERE parent_task_id = template_id 
      AND due_date >= start_of_period
      AND (reset_frequency = 'monthly' AND due_date < start_of_period + INTERVAL '1 month'
           OR reset_frequency = 'yearly' AND due_date < start_of_period + INTERVAL '1 year');
    
    RETURN counter;
END;
$$;

-- Function to generate instance name using rules
CREATE OR REPLACE FUNCTION generate_instance_name(
    template_title TEXT,
    frequency TEXT, 
    due_date DATE
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    pattern TEXT;
    counter INTEGER;
    instance_name TEXT;
BEGIN
    -- Get the naming pattern for this frequency
    SELECT naming_pattern INTO pattern
    FROM recurring_naming_rules 
    WHERE recurring_naming_rules.frequency = generate_instance_name.frequency;
    
    IF pattern IS NULL THEN
        -- Fallback pattern
        pattern := '{counter}-{month_abbrev}';
    END IF;
    
    -- For template_title, we need to find the template_id
    -- This is a simplified version - in practice you'd pass template_id
    counter := 1; -- Simplified for this function
    
    -- Build the name
    instance_name := template_title || ' (' || 
        REPLACE(
            REPLACE(
                REPLACE(
                    pattern,
                    '{counter}', counter::TEXT
                ),
                '{month_abbrev}', get_month_abbrev(due_date)
            ),
            '{year}', EXTRACT(year FROM due_date)::TEXT
        ) || ')';
    
    RETURN instance_name;
END;
$$;

-- PART 2: CONFIGURABLE DUE DATE SYSTEM
-- =====================================================================

-- Enhance recurring_naming_rules table to include due date configuration
ALTER TABLE recurring_naming_rules 
ADD COLUMN IF NOT EXISTS due_date_interval_value INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS due_date_interval_unit TEXT DEFAULT 'day', -- 'day', 'week', 'month', 'year'
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update existing rules with due date intervals
UPDATE recurring_naming_rules SET 
    due_date_interval_value = 1, 
    due_date_interval_unit = 'day',
    description = 'Daily recurring tasks - next instance due 1 day after completion'
WHERE frequency = 'daily';

UPDATE recurring_naming_rules SET 
    due_date_interval_value = 1, 
    due_date_interval_unit = 'week',
    description = 'Weekly recurring tasks - next instance due 1 week after completion'
WHERE frequency = 'weekly';

UPDATE recurring_naming_rules SET 
    due_date_interval_value = 2, 
    due_date_interval_unit = 'week',
    description = 'Bi-weekly recurring tasks - next instance due 2 weeks after completion'
WHERE frequency = 'bi-weekly';

UPDATE recurring_naming_rules SET 
    due_date_interval_value = 1, 
    due_date_interval_unit = 'month',
    description = 'Monthly recurring tasks - next instance due 1 month after completion'
WHERE frequency = 'monthly';

UPDATE recurring_naming_rules SET 
    due_date_interval_value = 3, 
    due_date_interval_unit = 'month',
    description = 'Quarterly recurring tasks - next instance due 3 months after completion'
WHERE frequency = 'quarterly';

UPDATE recurring_naming_rules SET 
    due_date_interval_value = 1, 
    due_date_interval_unit = 'year',
    description = 'Annual recurring tasks - next instance due 1 year after completion'
WHERE frequency = 'annually';

-- Create function to calculate next due date based on rules
CREATE OR REPLACE FUNCTION calculate_next_due_date(
    current_due_date DATE,
    frequency TEXT
)
RETURNS DATE
LANGUAGE plpgsql
AS $$
DECLARE
    interval_value INTEGER;
    interval_unit TEXT;
    next_date DATE;
BEGIN
    -- Get the interval configuration for this frequency
    SELECT due_date_interval_value, due_date_interval_unit 
    INTO interval_value, interval_unit
    FROM recurring_naming_rules 
    WHERE recurring_naming_rules.frequency = calculate_next_due_date.frequency
      AND is_active = TRUE;
    
    IF NOT FOUND THEN
        -- Fallback to default: add 1 day
        RAISE NOTICE 'No rule found for frequency %, using default 1 day', frequency;
        RETURN current_due_date + INTERVAL '1 day';
    END IF;
    
    -- Calculate next due date based on the rule
    CASE interval_unit
        WHEN 'day' THEN
            next_date := current_due_date + (interval_value || ' days')::INTERVAL;
        WHEN 'week' THEN
            next_date := current_due_date + (interval_value || ' weeks')::INTERVAL;
        WHEN 'month' THEN
            next_date := current_due_date + (interval_value || ' months')::INTERVAL;
        WHEN 'year' THEN
            next_date := current_due_date + (interval_value || ' years')::INTERVAL;
        ELSE
            -- Unknown unit, default to days
            next_date := current_due_date + (interval_value || ' days')::INTERVAL;
    END CASE;
    
    RETURN next_date;
END;
$$;

-- Overloaded function for TIMESTAMPTZ support
CREATE OR REPLACE FUNCTION calculate_next_due_date(
    current_due_date TIMESTAMPTZ,
    frequency TEXT
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
AS $$
DECLARE
    interval_value INTEGER;
    interval_unit TEXT;
    next_date TIMESTAMPTZ;
BEGIN
    -- Get the interval configuration for this frequency
    SELECT due_date_interval_value, due_date_interval_unit 
    INTO interval_value, interval_unit
    FROM recurring_naming_rules 
    WHERE recurring_naming_rules.frequency = calculate_next_due_date.frequency
      AND is_active = TRUE;
    
    IF NOT FOUND THEN
        -- Fallback to default: add 1 day
        RAISE NOTICE 'No rule found for frequency %, using default 1 day', frequency;
        RETURN current_due_date + INTERVAL '1 day';
    END IF;
    
    -- Calculate next due date based on the rule
    CASE interval_unit
        WHEN 'day' THEN
            next_date := current_due_date + (interval_value || ' days')::INTERVAL;
        WHEN 'week' THEN
            next_date := current_due_date + (interval_value || ' weeks')::INTERVAL;
        WHEN 'month' THEN
            next_date := current_due_date + (interval_value || ' months')::INTERVAL;
        WHEN 'year' THEN
            next_date := current_due_date + (interval_value || ' years')::INTERVAL;
        ELSE
            -- Unknown unit, default to days
            next_date := current_due_date + (interval_value || ' days')::INTERVAL;
    END CASE;
    
    RETURN next_date;
END;
$$;

-- PART 3: MAIN FUNCTIONS
-- =====================================================================

-- Main completion function with configurable due dates
CREATE OR REPLACE FUNCTION complete_task_and_generate_next(task_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    task_record tasks%ROWTYPE;
    template_record tasks%ROWTYPE;
    new_task_id UUID;
    next_due_date DATE;
    instance_name TEXT;
    counter INTEGER;
    template_id UUID;
BEGIN
    -- Get the task details
    SELECT * INTO task_record FROM tasks WHERE id = task_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Task not found',
            'completed_task_id', task_id,
            'new_recurring_task_id', null
        );
    END IF;
    
    -- Don't allow completion of templates
    IF task_record.is_template = TRUE THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Cannot complete template tasks',
            'completed_task_id', task_id,
            'new_recurring_task_id', null
        );
    END IF;
    
    -- Mark the task as completed
    IF task_record.status != 'completed' THEN
        UPDATE tasks 
        SET status = 'completed', updated_at = NOW()
        WHERE id = task_id;
        
        -- Refresh the task record
        SELECT * INTO task_record FROM tasks WHERE id = task_id;
    END IF;
    
    -- Check if this is a recurring instance and should generate the next one
    IF task_record.parent_task_id IS NOT NULL THEN
        template_id := task_record.parent_task_id;
    ELSIF task_record.is_recurring = TRUE AND task_record.is_template = FALSE THEN
        template_id := task_record.id;
    ELSE
        -- Not a recurring task, just return success
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Task completed',
            'completed_task_id', task_id,
            'new_recurring_task_id', null
        );
    END IF;
    
    -- Get template details
    SELECT * INTO template_record FROM tasks WHERE id = template_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Task completed, but template not found',
            'completed_task_id', task_id,
            'new_recurring_task_id', null
        );
    END IF;
    
    -- Calculate next due date using configurable rules
    next_due_date := calculate_next_due_date(task_record.due_date, template_record.recurring_frequency);
    
    -- Check if we should generate the next instance
    -- Only generate if within the end_date (if specified) and instance was generated
    IF next_due_date IS NOT NULL AND 
       (template_record.end_date IS NULL OR next_due_date <= template_record.end_date) THEN
        
        -- Check if this instance was already generated (prevent duplicates)
        IF task_record.is_generated = TRUE THEN
            -- Calculate counter for next instance
            counter := calculate_recurring_counter(template_id, template_record.recurring_frequency, next_due_date);
            
            -- Generate instance name
            instance_name := template_record.title || ' (' || 
                REPLACE(
                    REPLACE(
                        REPLACE(
                            (SELECT naming_pattern FROM recurring_naming_rules WHERE frequency = template_record.recurring_frequency),
                            '{counter}', counter::TEXT
                        ),
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
            RETURNING id INTO new_task_id;
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Task completed' || CASE WHEN new_task_id IS NOT NULL THEN ' and next recurring task generated' ELSE '' END,
        'completed_task_id', task_id,
        'new_recurring_task_id', new_task_id
    );
END;
$$;

-- Function to create first instance from template
CREATE OR REPLACE FUNCTION create_first_recurring_instance(template_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    template_record tasks%ROWTYPE;
    first_instance_id UUID;
    instance_name TEXT;
    first_due_date DATE;
    counter INTEGER := 1;
BEGIN
    -- Get template details
    SELECT * INTO template_record FROM tasks WHERE id = template_id AND is_template = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found or task is not a template';
    END IF;
    
    -- Calculate first due date using configurable rules
    first_due_date := calculate_next_due_date(template_record.start_date::DATE, template_record.recurring_frequency);
    
    -- Generate instance name
    instance_name := template_record.title || ' (' || 
        REPLACE(
            REPLACE(
                REPLACE(
                    (SELECT naming_pattern FROM recurring_naming_rules WHERE frequency = template_record.recurring_frequency),
                    '{counter}', counter::TEXT
                ),
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
        FALSE,
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
    RETURNING id INTO first_instance_id;
    
    RETURN first_instance_id;
END;
$$;

-- Function to update template name and cascade to instances
CREATE OR REPLACE FUNCTION update_template_name_cascade(
    template_id UUID,
    new_title TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    old_title TEXT;
    instance_record RECORD;
    new_instance_title TEXT;
BEGIN
    -- Get current template title
    SELECT title INTO old_title FROM tasks WHERE id = template_id AND is_template = TRUE;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update template
    UPDATE tasks SET title = new_title, updated_at = NOW() WHERE id = template_id;
    
    -- Update all instances that match the old pattern
    FOR instance_record IN 
        SELECT id, title, due_date, recurring_frequency, recurrence_count_in_period
        FROM tasks 
        WHERE parent_task_id = template_id AND is_template = FALSE
    LOOP
        -- Rebuild the instance title with the new template name
        new_instance_title := new_title || ' (' || 
            REPLACE(
                REPLACE(
                    REPLACE(
                        (SELECT naming_pattern FROM recurring_naming_rules WHERE frequency = instance_record.recurring_frequency),
                        '{counter}', instance_record.recurrence_count_in_period::TEXT
                    ),
                    '{month_abbrev}', get_month_abbrev(instance_record.due_date)
                ),
                '{year}', EXTRACT(year FROM instance_record.due_date)::TEXT
            ) || ')';
        
        UPDATE tasks 
        SET title = new_instance_title, 
            original_task_name = new_title,
            updated_at = NOW()
        WHERE id = instance_record.id;
    END LOOP;
    
    RETURN TRUE;
END;
$$;

-- PART 4: TEMPLATE PROTECTION TRIGGER
-- =====================================================================

-- Create trigger to protect templates from losing template status or having due_date/status set
CREATE OR REPLACE FUNCTION protect_template_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- If this was a template before, protect template status and fields
    IF OLD.is_template = TRUE THEN
        -- Prevent removal of template status
        NEW.is_template := TRUE;
        
        -- Keep due_date and status NULL for templates
        NEW.due_date := NULL;
        NEW.status := NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS protect_template_fields_trigger ON tasks;
CREATE TRIGGER protect_template_fields_trigger
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION protect_template_fields();

-- PART 5: ADMIN FUNCTIONS FOR RULE MANAGEMENT
-- =====================================================================

-- Function to update naming pattern for a frequency
CREATE OR REPLACE FUNCTION update_recurring_naming_pattern(
    freq TEXT,
    new_pattern TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE recurring_naming_rules 
    SET naming_pattern = new_pattern, created_at = NOW()
    WHERE frequency = freq;
    
    RETURN FOUND;
END;
$$;

-- Function to update due date interval for a frequency
CREATE OR REPLACE FUNCTION update_recurring_due_date_interval(
    freq TEXT,
    new_interval_value INTEGER,
    new_interval_unit TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate interval unit
    IF new_interval_unit NOT IN ('day', 'week', 'month', 'year') THEN
        RAISE EXCEPTION 'Invalid interval unit: %. Must be day, week, month, or year', new_interval_unit;
    END IF;
    
    UPDATE recurring_naming_rules 
    SET 
        due_date_interval_value = new_interval_value,
        due_date_interval_unit = new_interval_unit,
        created_at = NOW()
    WHERE frequency = freq;
    
    RETURN FOUND;
END;
$$;

-- Function to add new frequency rule
CREATE OR REPLACE FUNCTION add_recurring_frequency_rule(
    freq TEXT,
    pattern TEXT,
    counter_reset TEXT,
    interval_value INTEGER,
    interval_unit TEXT,
    rule_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate inputs
    IF counter_reset NOT IN ('monthly', 'yearly') THEN
        RAISE EXCEPTION 'Invalid counter reset frequency: %. Must be monthly or yearly', counter_reset;
    END IF;
    
    IF interval_unit NOT IN ('day', 'week', 'month', 'year') THEN
        RAISE EXCEPTION 'Invalid interval unit: %. Must be day, week, month, or year', interval_unit;
    END IF;
    
    INSERT INTO recurring_naming_rules (
        frequency,
        naming_pattern,
        counter_reset_frequency,
        due_date_interval_value,
        due_date_interval_unit,
        description,
        is_active
    )
    VALUES (
        freq,
        pattern,
        counter_reset,
        interval_value,
        interval_unit,
        rule_description,
        TRUE
    );
    
    RETURN TRUE;
EXCEPTION 
    WHEN unique_violation THEN
        RETURN FALSE;
END;
$$;

-- PART 6: PERMISSIONS
-- =====================================================================

GRANT EXECUTE ON FUNCTION get_month_abbrev(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_recurring_counter(UUID, TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_instance_name(TEXT, TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_next_due_date(DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_next_due_date(TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_task_and_generate_next(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_first_recurring_instance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_template_name_cascade(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_recurring_naming_pattern(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_recurring_due_date_interval(TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_recurring_frequency_rule(TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION get_month_abbrev(DATE) TO service_role;
GRANT EXECUTE ON FUNCTION calculate_recurring_counter(UUID, TEXT, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION generate_instance_name(TEXT, TEXT, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION calculate_next_due_date(DATE, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION calculate_next_due_date(TIMESTAMPTZ, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION complete_task_and_generate_next(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION create_first_recurring_instance(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION update_template_name_cascade(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION update_recurring_naming_pattern(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION update_recurring_due_date_interval(TEXT, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION add_recurring_frequency_rule(TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT) TO service_role;

-- PART 7: COMMENTS AND DOCUMENTATION
-- =====================================================================

COMMENT ON COLUMN recurring_naming_rules.due_date_interval_value IS 'Number of intervals to add for next due date (e.g., 2 for "every 2 weeks")';
COMMENT ON COLUMN recurring_naming_rules.due_date_interval_unit IS 'Unit for due date interval: day, week, month, year';
COMMENT ON COLUMN recurring_naming_rules.description IS 'Human-readable description of this recurring rule';
COMMENT ON COLUMN recurring_naming_rules.is_active IS 'Whether this rule is currently active and should be used';

COMMENT ON COLUMN tasks.is_template IS 'TRUE for recurring task templates (no due_date/status), FALSE for instances';
COMMENT ON COLUMN tasks.is_generated IS 'TRUE for auto-generated instances, FALSE for manually created tasks';

-- PART 8: VERIFICATION QUERIES
-- =====================================================================

-- Verify the setup
SELECT 'Setup verification:' as step;

-- Check table structure
SELECT 'Tasks table columns:' as check;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
  AND column_name IN ('due_date', 'status', 'is_template', 'is_generated', 'updated_at')
ORDER BY column_name;

-- Check recurring naming rules
SELECT 'Recurring naming rules:' as check;
SELECT frequency, naming_pattern, counter_reset_frequency, due_date_interval_value, due_date_interval_unit, description 
FROM recurring_naming_rules 
ORDER BY frequency;

-- Check functions
SELECT 'Functions created:' as check;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN (
    'get_month_abbrev',
    'calculate_recurring_counter',
    'calculate_next_due_date',
    'complete_task_and_generate_next',
    'create_first_recurring_instance',
    'update_template_name_cascade',
    'protect_template_fields'
)
ORDER BY routine_name;

-- Final success message
SELECT 'Complete recurring task system setup completed successfully!' as status,
       'You can now create recurring task templates with bi-weekly pattern support!' as message;
