-- Enhancement: Configurable Due Date Rules for Recurring Tasks
-- Date: 2025-06-19
-- This migration adds configurable due date intervals to the recurring task system

-- Part 1: Enhance recurring_naming_rules table to include due date configuration
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
    due_date_interval_unit = 'week',    description = 'Bi-weekly recurring tasks - next instance due 2 weeks after completion'
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

-- Part 2: Create function to calculate next due date based on rules
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

-- Part 3: Update the completion function to use configurable due dates
-- Drop existing function first to handle return type change
DROP FUNCTION IF EXISTS complete_task_and_generate_next(UUID);

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

-- Part 4: Create admin functions for managing rules

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

-- Part 5: Grant permissions
GRANT EXECUTE ON FUNCTION calculate_next_due_date(DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_recurring_naming_pattern(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_recurring_due_date_interval(TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_recurring_frequency_rule(TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION calculate_next_due_date(DATE, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION update_recurring_naming_pattern(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION update_recurring_due_date_interval(TEXT, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION add_recurring_frequency_rule(TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT) TO service_role;

-- Part 6: Add comments
COMMENT ON COLUMN recurring_naming_rules.due_date_interval_value IS 'Number of intervals to add for next due date (e.g., 2 for "every 2 weeks")';
COMMENT ON COLUMN recurring_naming_rules.due_date_interval_unit IS 'Unit for due date interval: day, week, month, year';
COMMENT ON COLUMN recurring_naming_rules.description IS 'Human-readable description of this recurring rule';
COMMENT ON COLUMN recurring_naming_rules.is_active IS 'Whether this rule is currently active and should be used';

-- Verification
SELECT 'Configurable due date rules added successfully!' as status;
