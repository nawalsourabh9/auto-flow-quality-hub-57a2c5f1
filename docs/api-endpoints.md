
# API Endpoints Reference for Task Management System

This document provides all the API endpoints for testing the Task Management System using Postman or similar tools.

## Base Configuration

**Base URL:** `https://sibaigcaglcmhfhvrwol.supabase.co`
**Headers Required:**
```
Content-Type: application/json
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYmFpZ2NhZ2xjbWhmaHZyd29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwOTQxMjUsImV4cCI6MjA1OTY3MDEyNX0.glqXwvhDZ9jSEE81JimH1gt-jHgaYyIh0svj5Q07PZw
Authorization: Bearer YOUR_ACCESS_TOKEN (if authenticated)
```

## Task Endpoints

### 1. Get All Tasks
```
GET /rest/v1/tasks?select=*
```

### 2. Get Single Task
```
GET /rest/v1/tasks?id=eq.{task_id}&select=*
```

### 3. Create Task (Single)
```
POST /rest/v1/tasks
Content-Type: application/json

{
  "title": "Test Task",
  "description": "Task description",
  "department": "Quality",
  "priority": "medium",
  "due_date": "2024-01-15",
  "is_recurring": false,
  "is_customer_related": false,
  "attachments_required": "none",
  "approval_status": "approved",
  "status": "not-started",
  "assignee": null
}
```

### 4. Create Recurring Task
```
POST /rest/v1/tasks
Content-Type: application/json

{
  "title": "Weekly Quality Check",
  "description": "Recurring quality inspection task",
  "department": "Quality",
  "priority": "high",
  "due_date": "2024-01-15",
  "is_recurring": true,
  "recurring_frequency": "weekly",
  "start_date": "2024-01-15",
  "end_date": "2024-06-15",
  "is_customer_related": false,
  "attachments_required": "required",
  "approval_status": "approved",
  "status": "not-started",
  "assignee": null,
  "recurring_parent_id": null
}
```

### 5. Update Task Status (Single Task)
```
PATCH /rest/v1/tasks?id=eq.{task_id}
Content-Type: application/json

{
  "status": "completed",
  "comments": "Task completed successfully"
}
```

### 6. Update Recurring Task Status
```
PATCH /rest/v1/tasks?id=eq.{task_id}
Content-Type: application/json

{
  "title": "Updated Recurring Task",
  "description": "Updated description",
  "department": "Quality",
  "priority": "medium",
  "due_date": "2024-01-20",
  "is_recurring": true,
  "recurring_frequency": "weekly",
  "start_date": "2024-01-15",
  "end_date": "2024-06-15",
  "is_customer_related": false,
  "attachments_required": "optional",
  "status": "in-progress",
  "comments": "Work in progress",
  "assignee": null
}
```

### 7. Update Task with Complete Data (Recommended for Recurring)
```
PATCH /rest/v1/tasks?id=eq.{task_id}
Content-Type: application/json

{
  "title": "Weekly Safety Inspection",
  "description": "Complete safety inspection of production floor",
  "department": "Quality",
  "priority": "high",
  "due_date": "2024-01-22",
  "is_recurring": true,
  "recurring_frequency": "weekly",
  "start_date": "2024-01-15",
  "end_date": "2024-12-31",
  "is_customer_related": false,
  "customer_name": null,
  "attachments_required": "required",
  "status": "completed",
  "comments": "Inspection completed - all safety protocols verified",
  "assignee": "user-uuid-here"
}
```

### 8. Delete Task
```
DELETE /rest/v1/tasks?id=eq.{task_id}
```

## Employee/User Endpoints

### 1. Get All Employees
```
GET /rest/v1/employees?select=*
```

### 2. Get Employee by ID
```
GET /rest/v1/employees?id=eq.{employee_id}&select=*
```

## Department Endpoints

### 1. Get All Departments
```
GET /rest/v1/departments?select=*
```

## Task Automation Edge Function

### 1. Trigger Task Automation (Manual)
```
POST /functions/v1/task-automation
Content-Type: application/json

{
  "action": "manual_trigger"
}
```

## Testing Scenarios

### Scenario 1: Create and Update Single Task
1. Create a single task using endpoint #3
2. Update its status using endpoint #5
3. Verify the update was successful

### Scenario 2: Create and Update Recurring Task
1. Create a recurring task using endpoint #4
2. Update it using endpoint #7 (with all required fields)
3. Verify all recurring fields are preserved

### Scenario 3: Test Recurring Task Validation
1. Try creating a recurring task missing start_date or end_date
2. Should receive validation error
3. Create with all required fields - should succeed

## Common Error Responses

### Missing Required Fields for Recurring Tasks
```json
{
  "code": "23514",
  "details": "Both start_date and end_date are required for recurring tasks",
  "hint": null,
  "message": "new row for relation \"tasks\" violates check constraint"
}
```

### Invalid Date Range
```json
{
  "code": "23514",
  "details": "End date must be after start date for recurring tasks",
  "hint": null,
  "message": "new row for relation \"tasks\" violates check constraint"
}
```

## Tips for Testing

1. **Always include all recurring fields** when updating recurring tasks
2. **Use proper date format**: `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SS`
3. **Check validation constraints** before making requests
4. **Use the complete update payload** (endpoint #7) for recurring tasks to avoid validation errors
5. **Test with different user permissions** if authentication is enabled

## Authentication Testing

If testing with authenticated users, first get an access token:

```
POST /auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

Then use the returned `access_token` in the Authorization header for subsequent requests.
