# Summary of Recent Changes and Current State for AI Model

This document outlines the key changes made to the BDS Management System, specifically focusing on the recurring task functionality, to provide context for an AI model.

## 1. Recurring Task Architecture Shift

The architecture for generating recurring task instances has shifted from a frontend-driven approach to a backend-driven approach.

- **Previous:** Frontend hooks (`use-task-create.ts`, `use-task-update.ts`) calculated and inserted all future recurring task instances upon initial task creation/update.
- **Current:**
    - Frontend hooks now only create/update the initial "parent" recurring task.
    - A backend PostgreSQL function (`public.generate_next_recurring_task_instance`) is responsible for automatically generating future recurring task instances on a schedule.

## 2. Database Schema Updates

The `public.tasks` table schema has been updated to support recurring tasks:

- Added columns: `start_date` (timestamp with time zone), `end_date` (timestamp with time zone), `recurring_parent_id` (uuid).
- Added a foreign key constraint (`tasks_recurring_parent_id_fkey`) on `recurring_parent_id` referencing `tasks(id)` with `ON DELETE CASCADE`.
- Added an index (`idx_tasks_recurring_parent_id`) on `recurring_parent_id`.

## 3. Server-Side Validation

A PostgreSQL trigger (`validate_recurring_task_dates_trigger`) and function (`validate_recurring_task_dates`) have been implemented on the `public.tasks` table to enforce data integrity for recurring tasks:

- Requires `start_date` and `end_date` if `is_recurring` is true.
- Ensures `end_date` is after `start_date`.
- Ensures `end_date` is within 6 months of `start_date`.

## 4. Backend Recurring Task Generation Logic (`public.generate_next_recurring_task_instance`)

This PostgreSQL function, scheduled to run periodically (e.g., daily at midnight) via `pg_cron`, implements the core logic for generating new recurring task instances based on specific requirements:

- **Trigger Condition:** A new instance is generated only if the most recent existing instance (parent or latest child) of a recurring task has a `status` of `completed`.
- **Overdue Status Update:** The function also updates the status of tasks (including recurring instances) to `overdue` if their `due_date` has passed and their status is not `completed`.
- **Next Instance `due_date` Calculation:** Calculates the `due_date` for the new instance based on the `due_date` of the previous completed instance, the `recurring_frequency`, and specific "reset" logic (to the beginning of the month for daily/weekly/bi-weekly, or beginning of the year for monthly/quarterly/annually) when crossing cycle boundaries.
- **New Instance `start_date` and `end_date`:**
    - `start_date` is set to the current timestamp when the function runs.
    - `end_date` is calculated by adding the duration of the parent task's original `start_date` to `end_date` to the new instance's `start_date`.
- **Task Naming:** Applies specific naming conventions to generated instances based on frequency (e.g., including day/week of month, or month/quarter/year).
- **Data Copying:** Copies other relevant task details (description, department, assignee, priority, etc.) from the parent task to the new instance.

## 5. Frontend Changes

- Frontend hooks (`use-task-create.ts`, `use-task-update.ts`) no longer perform bulk recurring task insertion. They manage the single parent task.
- Frontend validation in `RecurringTaskSection.tsx` ensures `start_date` and `end_date` are provided when `is_recurring` is true.

## 6. Current State

The recurring task feature is now driven by a robust backend process that generates new instances based on the completion of the previous task, specific date calculation and reset rules, and within the overall recurrence period defined by the parent task's original start and end dates. The database schema and server-side validation support this logic.

## 7. Potential Future Changes/Considerations

- **Error Handling and Logging:** Enhance error handling and logging within the PostgreSQL function for better debugging in a production environment.
- **Manual Generation Trigger:** Consider adding an option in the UI for administrators to manually trigger the recurring task generation function if needed.
- **More Complex Recurrence Patterns:** If needed, the backend logic can be extended to support more complex recurrence rules (e.g., specific days of the week, nth day of the month).
- **Time Zones:** Ensure consistent handling of time zones between the application, database, and `pg_cron` schedule.