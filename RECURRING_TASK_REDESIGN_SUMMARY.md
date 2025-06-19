# Recurring Task System Redesign - Implementation Summary

## Overview
This implementation provides a complete redesign of the recurring task system to separate templates from instances, with proper naming patterns and safeguards.

## 🚨 Database Rollback Instructions

### If Something Goes Wrong
If you need to revert the database changes, you have several options:

#### Option 1: Use the Rollback Migration
```sql
-- Apply the rollback migration
-- File: supabase/migrations/20250619_rollback_recurring_redesign.sql
```

#### Option 2: Manual Rollback Steps
1. **Backup current data first**:
```sql
CREATE TABLE tasks_backup_20250619 AS SELECT * FROM tasks;
CREATE TABLE recurring_naming_rules_backup_20250619 AS SELECT * FROM recurring_naming_rules;
```

2. **Restore previous state** by running the rollback migration

3. **If you have a database backup**, restore from before the migration

#### Option 3: Database Point-in-Time Recovery
- Use Supabase's point-in-time recovery feature
- Go to your Supabase dashboard → Settings → Database → Point in time recovery
- Restore to a time before applying the migration

## 🎛️ Configuring Rules (Naming & Due Dates)

### Understanding the Rules System

The system uses the `recurring_naming_rules` table to control both naming patterns and due date intervals:

```sql
-- View current rules
SELECT * FROM recurring_naming_rules ORDER BY frequency;
```

### Updating Naming Patterns

#### Table: `recurring_naming_rules`
**Key Columns:**
- `frequency`: 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'
- `naming_pattern`: Pattern with placeholders like 'D{counter}-{month_abbrev}'
- `counter_reset_frequency`: 'monthly' or 'yearly'

#### Available Placeholders:
- `{counter}`: Auto-incrementing number (resets based on counter_reset_frequency)
- `{month_abbrev}`: Jan, Feb, Mar, etc.
- `{year}`: 2025, 2026, etc.

#### Examples:

```sql
-- Change daily tasks to use "Day-1", "Day-2" format
SELECT update_recurring_naming_pattern('daily', 'Day-{counter}');

-- Change weekly tasks to include year: "W1-2025", "W2-2025"
SELECT update_recurring_naming_pattern('weekly', 'W{counter}-{year}');

-- Custom pattern for monthly: "Month 1 of Jun 2025"
SELECT update_recurring_naming_pattern('monthly', 'Month {counter} of {month_abbrev} {year}');
```

### Updating Due Date Intervals

The system now supports **configurable due date rules** instead of hardcoded intervals.

#### Table Columns:
- `due_date_interval_value`: Number (e.g., 2 for "every 2 weeks")
- `due_date_interval_unit`: 'day', 'week', 'month', 'year'

#### Examples:

```sql
-- Change daily tasks to be due every 2 days instead of 1
SELECT update_recurring_due_date_interval('daily', 2, 'day');

-- Change weekly tasks to be due every 10 days
SELECT update_recurring_due_date_interval('weekly', 10, 'day');

-- Change monthly tasks to be due every 6 weeks
SELECT update_recurring_due_date_interval('monthly', 6, 'week');

-- Change quarterly tasks to be due every 4 months instead of 3
SELECT update_recurring_due_date_interval('quarterly', 4, 'month');
```

### Adding New Frequency Rules

```sql
-- Add a new "every 3 days" frequency
SELECT add_recurring_frequency_rule(
    'tri-daily',                    -- frequency name
    'T{counter}-{month_abbrev}',    -- naming pattern
    'monthly',                      -- counter reset (monthly/yearly)
    3,                             -- interval value
    'day',                         -- interval unit
    'Every 3 days recurring task'   -- description
);
```

### Manual Rule Updates (Direct SQL)

If you prefer direct SQL updates:

```sql
-- Update naming pattern directly
UPDATE recurring_naming_rules 
SET naming_pattern = 'NEW_PATTERN_{counter}' 
WHERE frequency = 'daily';

-- Update due date interval directly
UPDATE recurring_naming_rules 
SET due_date_interval_value = 5,
    due_date_interval_unit = 'day'
WHERE frequency = 'weekly';

-- Add description
UPDATE recurring_naming_rules 
SET description = 'Custom description for this rule'
WHERE frequency = 'monthly';
```

### Rule Management UI (Future Enhancement)

Consider building an admin interface for rule management:

```typescript
// Example API calls for rule management
const updateNamingPattern = async (frequency: string, pattern: string) => {
  const { data, error } = await supabase
    .rpc('update_recurring_naming_pattern', { 
      freq: frequency, 
      new_pattern: pattern 
    });
};

const updateDueDateInterval = async (frequency: string, value: number, unit: string) => {
  const { data, error } = await supabase
    .rpc('update_recurring_due_date_interval', { 
      freq: frequency, 
      new_interval_value: value,
      new_interval_unit: unit
    });
};
```

## Key Changes

### 1. Database Schema Changes
- **Made `due_date` and `status` nullable** for templates
- **Added `is_template` boolean** to identify templates vs instances
- **Added `is_generated` boolean** to track auto-generated instances
- **Added `recurring_naming_rules` table** for flexible naming patterns
- **Added `updated_at` timestamp** with automatic trigger

### 2. Template vs Instance Logic
- **Templates**: Have `is_template = TRUE`, `due_date = NULL`, `status = NULL`
- **Instances**: Have `is_template = FALSE`, proper due dates and status
- **First instance creation**: Automatically created when template start_date is today or past
- **Instance naming**: Uses pattern-based naming (e.g., "Daily Task (D1-Jun)", "Weekly Task (W2-Jul)")

### 3. Naming Rules System
- **Daily/Weekly/Biweekly**: Counter resets monthly (D1-Jan, D2-Jan, D1-Feb, D2-Feb...)
- **Monthly/Quarterly/Yearly**: Counter resets yearly (M1-2025, M2-2025, M1-2026...)
- **Configurable patterns**: Stored in `recurring_naming_rules` table

### 4. Safety Features
- **Template protection**: Templates cannot be completed or marked as overdue
- **Duplicate prevention**: `is_generated` flag prevents duplicate instance creation
- **Status protection**: Only 'not-started' and 'in-progress' tasks can become overdue
- **Completion logic**: Only allows completion if not a template

### 5. Frontend Updates
- **Visual distinction**: Templates have purple border and "Template" status badge
- **Task creation**: Recurring tasks create templates, first instance auto-generated
- **Status handling**: Templates show "Template" instead of status
- **Row styling**: Templates highlighted with purple background

### 6. Database Functions
- **`complete_task_and_generate_next()`**: Handles completion and next instance generation
- **`mark_tasks_overdue_simple()`**: Excludes templates from overdue marking
- **`create_first_recurring_instance()`**: Creates first instance from template
- **`calculate_recurring_counter()`**: Handles counter logic with resets
- **`update_template_name_cascade()`**: Updates all instances when template name changes
- **`get_month_abbrev()`**: Helper for month abbreviations

## Files Modified

### Migration Files
- `supabase/migrations/20250618_recurring_task_redesign.sql` - New comprehensive migration
- `manual_fix.sql` - Updated manual SQL for direct application

### Frontend Files
- `src/types/task.ts` - Updated Task interface for new fields
- `src/hooks/task-operations/use-task-create.ts` - Template creation logic
- `src/hooks/task-operations/use-task-update.ts` - Template completion protection
- `src/components/tasks/table/TaskStatusBadge.tsx` - Template status display
- `src/components/tasks/table/TaskTableRow.tsx` - Template visual styling

## How It Works

### Template Creation
1. User creates recurring task → System creates template (no due_date/status)
2. If start_date ≤ today → Automatically creates first instance
3. Template stored with all recurring configuration

### Instance Generation
1. User completes instance → `complete_task_and_generate_next()` called
2. Function calculates next due date based on frequency
3. Generates proper instance name with counter logic
4. Creates new instance with incremented counter
5. Only creates if within end_date (if specified)

### Counter Reset Logic
- **Monthly reset**: Daily (D1, D2...), Weekly (W1, W2...), Biweekly (B1, B2...)
- **Yearly reset**: Monthly (M1, M2...), Quarterly (Q1, Q2...), Yearly (Y1, Y2...)

### Visual Indicators
- **Templates**: Purple left border, "Template" status badge
- **Instances**: Normal display with proper status
- **Nested view**: Instances indented under their templates

## Migration Process

### Automatic Conversion
The migration automatically:
1. Converts existing recurring tasks to templates
2. Creates first instances for templates with due dates
3. Preserves completion status on converted instances
4. Maintains all relationships and data

### Manual Application
Use `manual_fix.sql` for direct SQL execution in Supabase SQL Editor.

## Benefits

1. **Clear separation** between templates and instances
2. **Flexible naming** with configurable patterns
3. **Robust safeguards** prevent common errors
4. **Visual clarity** distinguishes templates from work items
5. **Counter management** with logical reset periods
6. **Duplicate prevention** ensures one instance per completion
7. **Template name changes** cascade to all instances
8. **Performance optimized** with proper indexes

## Testing Recommendations

1. **Create recurring templates** with different frequencies
2. **Complete instances** and verify next instance generation
3. **Test counter resets** across month/year boundaries
4. **Verify template protection** (cannot complete/edit status)
5. **Test name cascading** when template names change
6. **Check overdue logic** excludes templates
7. **Validate visual styling** for templates vs instances
8. **Test rule changes** and their effects on new instances
9. **Test rollback migration** in a safe environment first

## 🔧 Updating Existing Task Due Dates

### Bulk Update Instance Due Dates
If you need to update due dates for existing instances after changing rules:

```sql
-- Update all instances of a specific template to follow new due date pattern
WITH template_instances AS (
  SELECT id, due_date, parent_task_id, recurring_frequency,
         ROW_NUMBER() OVER (PARTITION BY parent_task_id ORDER BY due_date) as instance_number
  FROM tasks 
  WHERE parent_task_id = 'YOUR_TEMPLATE_ID' 
    AND is_template = FALSE
)
UPDATE tasks 
SET due_date = (
  SELECT calculate_next_due_date(
    (SELECT start_date FROM tasks WHERE id = 'YOUR_TEMPLATE_ID'),
    (SELECT recurring_frequency FROM tasks WHERE id = 'YOUR_TEMPLATE_ID')
  ) + ((instance_number - 1) * INTERVAL '1 day') -- Adjust interval as needed
)
FROM template_instances 
WHERE tasks.id = template_instances.id;
```

### Update Individual Task Due Dates
```sql
-- Manually update specific task due dates
UPDATE tasks 
SET due_date = '2025-07-01', updated_at = NOW()
WHERE id = 'specific_task_id';
```

## 📋 Quick Reference Commands

### View Current Rules
```sql
-- See all naming and due date rules
SELECT 
    frequency,
    naming_pattern,
    counter_reset_frequency,
    due_date_interval_value || ' ' || due_date_interval_unit as interval,
    description,
    is_active
FROM recurring_naming_rules 
ORDER BY frequency;
```

### Test Rule Changes
```sql
-- Test what the next due date would be
SELECT calculate_next_due_date('2025-06-19'::DATE, 'daily');
SELECT calculate_next_due_date('2025-06-19'::DATE, 'weekly');
```

### View Templates and Their Instances
```sql
-- See all templates and their instance counts
SELECT 
    t.id,
    t.title,
    t.recurring_frequency,
    COUNT(i.id) as instance_count,
    MAX(i.due_date) as latest_instance_due_date
FROM tasks t
LEFT JOIN tasks i ON i.parent_task_id = t.id AND i.is_template = FALSE
WHERE t.is_template = TRUE
GROUP BY t.id, t.title, t.recurring_frequency
ORDER BY t.title;
```

This redesign provides a robust, scalable system for managing recurring tasks with clear separation of concerns, configurable rules, comprehensive safety features, and easy rollback capabilities.
