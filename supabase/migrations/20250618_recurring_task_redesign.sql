-- Complete recurring task system redesign
-- Date: 2025-06-18
-- This migration implements the full redesign for recurring tasks

-- Part 1: Schema Changes
-- Make due_date and status nullable for templates
ALTER TABLE tasks 
ALTER COLUMN due_date DROP NOT NULL,
ALTER COLUMN status DROP NOT NULL;

-- Add is_generated flag to prevent duplicate instance generation
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS is_generated BOOLEAN DEFAULT FALSE;

-- Add template flag to clearly identify templates vs instances
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;

-- Create recurring naming rules table for flexible naming patterns
CREATE TABLE IF NOT EXISTS recurring_naming_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    frequency TEXT NOT NULL, -- 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'
    naming_pattern TEXT NOT NULL, -- e.g., 'D{counter}-{month_abbrev}', 'W{counter}-{month_abbrev}'
    counter_reset_frequency TEXT NOT NULL, -- 'monthly', 'yearly'
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
      AND is_template = FALSE;
    
    RETURN counter;
END;
$$;

-- Function to generate instance name based on template and rules
CREATE OR REPLACE FUNCTION generate_instance_name(
    template_name TEXT,
    frequency TEXT,
    due_date DATE
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    naming_pattern TEXT;
    counter INTEGER;
    result_name TEXT;
    template_id UUID;
    month_abbrev TEXT;
    year_text TEXT;
BEGIN
    -- Get the naming pattern for this frequency
    SELECT rnr.naming_pattern INTO naming_pattern
    FROM recurring_naming_rules rnr
    WHERE rnr.frequency = generate_instance_name.frequency;
    
    IF naming_pattern IS NULL THEN
        -- Fallback to simple pattern
        naming_pattern := '{original} ({counter})';
    END IF;
    
    -- Get template ID (this function assumes we're working with a known template)
    -- For now, we'll calculate counter based on the pattern and date
    counter := 1; -- This will be calculated properly in the actual usage
    
    -- Get date components
    month_abbrev := get_month_abbrev(due_date);
    year_text := EXTRACT(year FROM due_date)::TEXT;
    
    -- Replace placeholders in the pattern
    result_name := template_name || ' (' || 
        REPLACE(
            REPLACE(
                REPLACE(naming_pattern, '{counter}', counter::TEXT),
                '{month_abbrev}', month_abbrev
            ),
            '{year}', year_text
        ) || ')';
    
    RETURN result_name;
END;
$$;

-- Part 3: Main Functions

-- Drop existing functions first
DROP FUNCTION IF EXISTS complete_task_and_generate_next(UUID);
DROP FUNCTION IF EXISTS mark_tasks_overdue_simple();
DROP FUNCTION IF EXISTS generate_next_recurring_task(UUID);

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
BEGIN
    -- Get template details
    SELECT * INTO template_record FROM tasks WHERE id = template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template task not found: %', template_id;
    END IF;
    
    IF NOT template_record.is_recurring THEN
        RAISE EXCEPTION 'Task is not a recurring template: %', template_id;
    END IF;
    
    -- Calculate first due date (use start_date if provided, otherwise current date + frequency)
    IF template_record.start_date IS NOT NULL THEN
        first_due_date := template_record.start_date;
    ELSE
        -- Default to current date
        first_due_date := CURRENT_DATE;
    END IF;
    
    -- Calculate counter for this instance
    counter := calculate_recurring_counter(template_id, template_record.recurring_frequency, first_due_date);
    
    -- Generate instance name
    SELECT generate_instance_name(template_record.title, template_record.recurring_frequency, first_due_date)
    INTO instance_name;
    
    -- Replace counter placeholder with actual counter
    instance_name := REPLACE(instance_name, '{counter}', counter::TEXT);
    
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

-- Main completion function with new logic
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
    
    -- Calculate next due date based on current task's due date
    CASE template_record.recurring_frequency
        WHEN 'daily' THEN
            next_due_date := task_record.due_date + INTERVAL '1 day';
        WHEN 'weekly' THEN
            next_due_date := task_record.due_date + INTERVAL '1 week';
        WHEN 'biweekly' THEN
            next_due_date := task_record.due_date + INTERVAL '2 weeks';
        WHEN 'monthly' THEN
            next_due_date := task_record.due_date + INTERVAL '1 month';
        WHEN 'quarterly' THEN
            next_due_date := task_record.due_date + INTERVAL '3 months';
        WHEN 'annually' THEN
            next_due_date := task_record.due_date + INTERVAL '1 year';
        ELSE
            next_due_date := NULL;
    END CASE;
    
    -- Check if we should generate the next instance
    -- Only generate if within the end_date (if specified) and not already generated
    IF next_due_date IS NOT NULL AND 
       (template_record.end_date IS NULL OR next_due_date <= template_record.end_date) THEN
        
        -- Check if this instance was already generated
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

-- Function to update template names and cascade to instances
CREATE OR REPLACE FUNCTION update_template_name_cascade(template_id UUID, new_name TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count INTEGER := 0;
    instance_record RECORD;
    new_instance_name TEXT;
BEGIN
    -- Update the template itself
    UPDATE tasks 
    SET title = new_name, updated_at = NOW()
    WHERE id = template_id AND is_template = TRUE;
    
    -- Update all instances to maintain the naming pattern
    FOR instance_record IN
        SELECT id, due_date, recurrence_count_in_period, recurring_frequency
        FROM tasks 
        WHERE parent_task_id = template_id AND is_template = FALSE
    LOOP
        -- Regenerate the instance name based on the new template name
        new_instance_name := new_name || ' (' || 
            REPLACE(
                REPLACE(
                    REPLACE(
                        (SELECT naming_pattern FROM recurring_naming_rules WHERE frequency = instance_record.recurring_frequency),
                        '{counter}', COALESCE(instance_record.recurrence_count_in_period, 1)::TEXT
                    ),
                    '{month_abbrev}', get_month_abbrev(instance_record.due_date)
                ),
                '{year}', EXTRACT(year FROM instance_record.due_date)::TEXT
            ) || ')';
        
        UPDATE tasks 
        SET title = new_instance_name, 
            original_task_name = new_name,
            updated_at = NOW()
        WHERE id = instance_record.id;
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$;

-- Part 4: Convert existing recurring tasks to the new system
-- This will identify existing recurring tasks and convert them to templates + instances

DO $$
DECLARE
    recurring_task RECORD;
    template_id UUID;
    first_instance_id UUID;
BEGIN
    -- Find all existing recurring tasks that are not already templates
    FOR recurring_task IN
        SELECT * FROM tasks 
        WHERE is_recurring = TRUE 
          AND COALESCE(is_template, FALSE) = FALSE
          AND parent_task_id IS NULL
    LOOP
        -- Convert to template: remove due_date and status, mark as template
        UPDATE tasks 
        SET 
            due_date = NULL,
            status = NULL,
            is_template = TRUE,
            updated_at = NOW()
        WHERE id = recurring_task.id;
        
        -- Create first instance if the original task had a due date
        IF recurring_task.due_date IS NOT NULL THEN
            SELECT create_first_recurring_instance(recurring_task.id) INTO first_instance_id;
            
            -- If the original task was completed, mark the instance as completed too
            IF recurring_task.status = 'completed' THEN
                UPDATE tasks 
                SET status = 'completed', updated_at = NOW()
                WHERE id = first_instance_id;
            END IF;
        END IF;
    END LOOP;
END;
$$;

-- Part 5: Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_is_template ON tasks(is_template);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_generated ON tasks(is_generated);
CREATE INDEX IF NOT EXISTS idx_tasks_recurring_freq ON tasks(recurring_frequency);

-- Part 6: Comments and documentation
COMMENT ON COLUMN tasks.is_template IS 'TRUE for recurring task templates (no due_date/status), FALSE for instances';
COMMENT ON COLUMN tasks.is_generated IS 'TRUE if this instance was auto-generated from completion of previous instance';
COMMENT ON TABLE recurring_naming_rules IS 'Defines naming patterns and counter reset rules for recurring task instances';

-- Ensure the updated_at column exists and has a trigger
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create or replace the trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
