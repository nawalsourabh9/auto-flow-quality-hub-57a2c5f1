-- Function to generate the next recurring task instance
CREATE OR REPLACE FUNCTION public.generate_next_recurring_task_instance()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    parent_task RECORD;
    latest_instance RECORD;
    next_due_date TIMESTAMP WITH TIME ZONE;
    new_task_id UUID;
    -- Variables for new instance start/end dates
    new_start_date TIMESTAMP WITH TIME ZONE;
    new_end_date TIMESTAMP WITH TIME ZONE;
    task_duration INTERVAL;
BEGIN
    RAISE NOTICE 'Starting generate_next_recurring_task_instance at %', now();

    -- Update status to 'overdue' for tasks that are not completed and past their due date
    RAISE NOTICE 'Checking for overdue tasks...';
    UPDATE public.tasks
    SET status = 'overdue'
    WHERE status IN ('not-started', 'in-progress')
      AND due_date < now();
    RAISE NOTICE 'Finished checking for overdue tasks.';

    -- Loop through all parent recurring tasks
    FOR parent_task IN
        SELECT
            id,
            title,
            description,
            start_date, -- Added start_date
            due_date,
            recurring_frequency,
            end_date
        FROM
            public.tasks
        WHERE
            is_recurring = TRUE AND recurring_parent_id IS NULL
    LOOP
        RAISE NOTICE 'Processing parent task ID: %, Title: %', parent_task.id, parent_task.title;

        -- Find the latest instance (either the parent itself or its most recent child)
        SELECT t.*
        INTO latest_instance
        FROM public.tasks t
        WHERE t.recurring_parent_id = parent_task.id OR t.id = parent_task.id
        ORDER BY t.due_date DESC, t.created_at DESC -- Assuming created_at for tie-breaking
        LIMIT 1;

        IF latest_instance IS NULL THEN
            RAISE WARNING 'Could not find latest instance for parent task ID: %', parent_task.id;
            CONTINUE;
        END IF;

        RAISE NOTICE 'Latest instance ID: %, Due Date: %, Status: %', latest_instance.id, latest_instance.due_date, latest_instance.status;

        -- Condition for generating a new instance:
        -- Generate if the latest instance's due_date is in the past OR if the latest instance is completed.
        -- And ensure the end_date is not exceeded.
        IF latest_instance.status = 'completed'
           AND (parent_task.end_date IS NULL OR latest_instance.due_date < parent_task.end_date) THEN

            -- Calculate the next due_date based on recurring_frequency
            -- Calculate the next due_date based on recurring_frequency and reset logic
            DECLARE
                next_due_date_candidate TIMESTAMP WITH TIME ZONE;
                start_of_new_cycle TIMESTAMP WITH TIME ZONE;
                parent_day_of_week INTEGER;
                current_day_of_week INTEGER;
                days_to_add INTEGER;
                parent_day_of_month INTEGER;
                parent_month INTEGER;
                new_year INTEGER;
                target_month INTEGER;
                last_day_of_month INTEGER;
            BEGIN -- Inner block for variable declaration

            CASE parent_task.recurring_frequency
                WHEN 'daily' THEN
                    next_due_date_candidate := latest_instance.due_date + INTERVAL '1 day';
                    IF EXTRACT(MONTH FROM next_due_date_candidate) <> EXTRACT(MONTH FROM latest_instance.due_date) THEN
                        next_due_date := date_trunc('month', next_due_date_candidate);
                    ELSE
                        next_due_date := next_due_date_candidate;
                    END IF;
                WHEN 'weekly' THEN
                    next_due_date_candidate := latest_instance.due_date + INTERVAL '1 week';
                    IF EXTRACT(MONTH FROM next_due_date_candidate) <> EXTRACT(MONTH FROM latest_instance.due_date) THEN
                        start_of_new_cycle := date_trunc('month', next_due_date_candidate);
                        parent_day_of_week := EXTRACT(DOW FROM parent_task.due_date);
                        current_day_of_week := EXTRACT(DOW FROM start_of_new_cycle);
                        days_to_add := (parent_day_of_week - current_day_of_week + 7) % 7;
                        next_due_date := start_of_new_cycle + days_to_add * INTERVAL '1 day';
                    ELSE
                        next_due_date := next_due_date_candidate;
                    END IF;
                WHEN 'bi-weekly' THEN
                    next_due_date_candidate := latest_instance.due_date + INTERVAL '2 weeks';
                    IF EXTRACT(MONTH FROM next_due_date_candidate) <> EXTRACT(MONTH FROM latest_instance.due_date) THEN
                        start_of_new_cycle := date_trunc('month', next_due_date_candidate);
                        parent_day_of_week := EXTRACT(DOW FROM parent_task.due_date);
                        current_day_of_week := EXTRACT(DOW FROM start_of_new_cycle);
                        days_to_add := (parent_day_of_week - current_day_of_week + 7) % 7;
                        next_due_date := start_of_new_cycle + days_to_add * INTERVAL '1 day';
                    ELSE
                        next_due_date := next_due_date_candidate;
                    END IF;
                WHEN 'monthly' THEN
                    next_due_date_candidate := latest_instance.due_date + INTERVAL '1 month';
                    IF EXTRACT(YEAR FROM next_due_date_candidate) <> EXTRACT(YEAR FROM latest_instance.due_date) THEN
                        new_year := EXTRACT(YEAR FROM next_due_date_candidate);
                        parent_day_of_month := EXTRACT(DAY FROM parent_task.due_date);
                        target_month := 1; -- January
                        last_day_of_month := EXTRACT(DAY FROM (date_trunc('month', MAKE_DATE(new_year, target_month, 1)) + INTERVAL '1 month - 1 day'));
                        next_due_date := MAKE_DATE(new_year, target_month, LEAST(parent_day_of_month, last_day_of_month));
                    ELSE
                        next_due_date := next_due_date_candidate;
                    END IF;
                WHEN 'quarterly' THEN
                    next_due_date_candidate := latest_instance.due_date + INTERVAL '3 months';
                     IF EXTRACT(YEAR FROM next_due_date_candidate) <> EXTRACT(YEAR FROM latest_instance.due_date) THEN
                        new_year := EXTRACT(YEAR FROM next_due_date_candidate);
                        parent_day_of_month := EXTRACT(DAY FROM parent_task.due_date);
                        target_month := 1; -- January (Start of Q1)
                        last_day_of_month := EXTRACT(DAY FROM (date_trunc('month', MAKE_DATE(new_year, target_month, 1)) + INTERVAL '1 month - 1 day'));
                        next_due_date := MAKE_DATE(new_year, target_month, LEAST(parent_day_of_month, last_day_of_month));
                    ELSE
                        next_due_date := next_due_date_candidate;
                    END IF;
                WHEN 'annually' THEN
                    next_due_date_candidate := latest_instance.due_date + INTERVAL '1 year';
                    IF EXTRACT(YEAR FROM next_due_date_candidate) <> EXTRACT(YEAR FROM latest_instance.due_date) THEN
                        new_year := EXTRACT(YEAR FROM next_due_date_candidate);
                        parent_month := EXTRACT(MONTH FROM parent_task.due_date);
                        parent_day_of_month := EXTRACT(DAY FROM parent_task.due_date);
                        last_day_of_month := EXTRACT(DAY FROM (date_trunc('month', MAKE_DATE(new_year, parent_month, 1)) + INTERVAL '1 month - 1 day'));
                        next_due_date := MAKE_DATE(new_year, parent_month, LEAST(parent_day_of_month, last_day_of_month));
                    ELSE
                        next_due_date := next_due_date_candidate;
                    END IF;
                ELSE
                    RAISE WARNING 'Unknown recurring_frequency for task ID %: %', parent_task.id, parent_task.recurring_frequency;
                    CONTINUE; -- Skip to the next parent task
            END CASE;

            END; -- End inner block

            -- Ensure the new due_date does not exceed the end_date if specified
            IF parent_task.end_date IS NOT NULL AND next_due_date > parent_task.end_date THEN
                RAISE NOTICE 'Skipping task ID % as next instance due date % exceeds end_date %', parent_task.id, next_due_date, parent_task.end_date;
                CONTINUE;
            END IF;

            -- Check if a task with this next_due_date already exists for this parent
            -- This prevents duplicate instances if the cron job runs multiple times in a short period
            IF EXISTS (SELECT 1 FROM public.tasks WHERE recurring_parent_id = parent_task.id AND due_date = next_due_date) THEN
                RAISE NOTICE 'Task instance for parent % with due date % already exists. Skipping.', parent_task.id, next_due_date;
                CONTINUE;
            END IF;

            RAISE NOTICE 'Generating new instance for parent task ID: % with next due date: %', parent_task.id, next_due_date;

            -- Calculate new start and end dates
            new_start_date := NOW();
            new_end_date := NULL; -- Default to NULL
            IF parent_task.start_date IS NOT NULL AND parent_task.end_date IS NOT NULL THEN
              task_duration := parent_task.end_date - parent_task.start_date;
              new_end_date := new_start_date + task_duration;
            END IF;

            -- Insert the new task instance
            INSERT INTO public.tasks (
                title,
                description,
                due_date,
                status,
                is_recurring,
                recurring_parent_id,
                recurring_frequency,
                end_date,
                start_date, -- Added start_date
                end_date,   -- Added end_date
                created_at,
                updated_at
            ) VALUES (
                parent_task.title || CASE parent_task.recurring_frequency
                    WHEN 'daily' THEN ' (Day ' || EXTRACT(DAY FROM next_due_date) || ' of Month ' || EXTRACT(MONTH FROM next_due_date) || ')'
                    WHEN 'weekly' THEN ' (Week ' || EXTRACT(WEEK FROM next_due_date) || ' of Month ' || EXTRACT(MONTH FROM next_due_date) || ')'
                    WHEN 'bi-weekly' THEN ' (Week ' || EXTRACT(WEEK FROM next_due_date) || ' of Month ' || EXTRACT(MONTH FROM next_due_date) || ')' -- Using same as weekly for now
                    WHEN 'monthly' THEN ' (' || TO_CHAR(next_due_date, 'Mon YYYY') || ')'
                    WHEN 'quarterly' THEN ' (Q' || EXTRACT(QUARTER FROM next_due_date) || ' ' || EXTRACT(YEAR FROM next_due_date) || ')'
                    WHEN 'annually' THEN ' (' || EXTRACT(YEAR FROM next_due_date) || ')'
                    ELSE ''
                END,
                parent_task.description,
                next_due_date,
                'pending', -- Default status for new recurring tasks
                TRUE, -- New instance is also part of the recurring series
                parent_task.id,
                parent_task.recurring_frequency,
                parent_task.end_date,
                new_start_date, -- Use calculated new_start_date
                new_end_date,   -- Use calculated new_end_date
                now(),
                now()
            ) RETURNING id INTO new_task_id;

            RAISE NOTICE 'Generated new task instance with ID: % for parent %', new_task_id, parent_task.id;

        ELSE
            RAISE NOTICE 'No new instance needed for parent task ID: % (latest due date: %, status: %, end date: %)', parent_task.id, latest_instance.due_date, latest_instance.status, parent_task.end_date;
        END IF;

    END LOOP;

    RAISE NOTICE 'Finished generate_next_recurring_task_instance.';
END;
$$;

-- Schedule the function to run daily at midnight
SELECT cron.schedule(
    'generate_recurring_tasks_daily', -- job name
    '0 0 * * *',                      -- cron schedule (daily at midnight)
    'SELECT public.generate_next_recurring_task_instance();'
);