# Migration Application Order Guide

## 📋 Files to Apply (In Order)

### 1. Core Redesign Migration
**File**: `supabase/migrations/20250618_recurring_task_redesign.sql`
- Creates the basic template/instance system
- Adds is_template and is_generated columns
- Creates recurring_naming_rules table
- Sets up core functions

### 2. Enhanced Due Date Rules (Optional)
**File**: `supabase/migrations/20250619_configurable_due_dates.sql`
- Adds configurable due date intervals
- Enhances recurring_naming_rules table
- Replaces hardcoded due date logic with configurable rules
- **Apply this AFTER the core migration**

### 3. Rollback Migration (Emergency Only)
**File**: `supabase/migrations/20250619_rollback_recurring_redesign.sql`
- **ONLY use if you need to revert everything**
- Will lose all template/instance structure
- Converts templates back to regular recurring tasks

## 🎯 Recommended Approach

### For New Installations:
1. Apply core migration: `20250618_recurring_task_redesign.sql`
2. Apply enhanced rules: `20250619_configurable_due_dates.sql`

### For Existing Systems:
1. **Backup your database first!**
2. Test in staging environment
3. Apply core migration during low-usage period
4. Verify functionality
5. Optionally apply enhanced rules

### If Things Go Wrong:
1. Use rollback migration: `20250619_rollback_recurring_redesign.sql`
2. Or restore from backup
3. Or use Supabase point-in-time recovery

## 🧪 Testing Checklist

Before production deployment:

- [ ] Create test recurring template
- [ ] Generate first instance automatically
- [ ] Complete instance and verify next generation
- [ ] Test template cannot be completed
- [ ] Verify naming patterns work correctly
- [ ] Test counter resets (if crossing month/year boundaries)
- [ ] Verify overdue logic excludes templates
- [ ] Test rule modifications (if using enhanced migration)
- [ ] Test rollback migration in separate environment

## 📞 Emergency Recovery

If production issues occur:

1. **Immediate**: Apply rollback migration
2. **Assess**: Check what went wrong
3. **Fix**: Address issues in staging
4. **Redeploy**: Apply fixed migration

Remember: Database changes are harder to revert than code changes, so always test thoroughly first!
