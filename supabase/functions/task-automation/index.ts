
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'

interface Task {
  id: string;
  title: string;
  description: string;
  department: string;
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  status: 'completed' | 'in-progress' | 'overdue' | 'not-started';
  is_recurring: boolean;
  recurring_frequency?: string;
  start_date?: string;
  end_date?: string;
  assignee?: string;
  is_customer_related?: boolean;
  customer_name?: string;
  attachments_required: 'none' | 'optional' | 'required';
  approval_status: 'pending' | 'approved' | 'rejected';
  recurring_parent_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting task automation process...')

    // 1. Update overdue tasks
    await updateOverdueTasks(supabase)

    // 2. Create recurring tasks
    await createRecurringTasks(supabase)

    return new Response(
      JSON.stringify({ success: true, message: 'Task automation completed successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in task automation:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function updateOverdueTasks(supabase: any) {
  console.log('Checking for overdue tasks...')
  
  const now = new Date().toISOString()
  
  // Find tasks that are past due and not completed
  const { data: overdueTasks, error } = await supabase
    .from('tasks')
    .select('*')
    .lt('due_date', now)
    .neq('status', 'completed')
    .neq('status', 'overdue')

  if (error) {
    console.error('Error fetching overdue tasks:', error)
    throw error
  }

  if (overdueTasks && overdueTasks.length > 0) {
    console.log(`Found ${overdueTasks.length} overdue tasks`)
    
    // Update status to overdue
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ status: 'overdue' })
      .in('id', overdueTasks.map((task: Task) => task.id))

    if (updateError) {
      console.error('Error updating overdue tasks:', updateError)
      throw updateError
    }

    console.log(`Successfully marked ${overdueTasks.length} tasks as overdue`)
  } else {
    console.log('No overdue tasks found')
  }
}

async function createRecurringTasks(supabase: any) {
  console.log('Checking for recurring tasks to create...')
  
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  
  // Find recurring tasks that should generate new instances today
  const { data: recurringTasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_recurring', true)
    .not('recurring_frequency', 'is', null)
    .not('start_date', 'is', null)
    .not('end_date', 'is', null)
    .lte('start_date', todayStr)
    .gte('end_date', todayStr)

  if (error) {
    console.error('Error fetching recurring tasks:', error)
    throw error
  }

  if (!recurringTasks || recurringTasks.length === 0) {
    console.log('No recurring tasks found')
    return
  }

  console.log(`Found ${recurringTasks.length} recurring tasks to process`)

  for (const task of recurringTasks) {
    await processRecurringTask(supabase, task, today)
  }
}

async function processRecurringTask(supabase: any, parentTask: Task, today: Date) {
  const frequency = parentTask.recurring_frequency
  const todayStr = today.toISOString().split('T')[0]
  
  // Calculate the next due date based on frequency
  const nextDueDate = calculateNextDueDate(parentTask.due_date, frequency, today)
  
  if (!nextDueDate) {
    console.log(`Invalid frequency for task ${parentTask.id}: ${frequency}`)
    return
  }

  const nextDueDateStr = nextDueDate.toISOString().split('T')[0]
  
  // Check if we should create a task for this date
  if (!shouldCreateTaskForDate(frequency, parentTask.due_date, todayStr)) {
    return
  }

  // Check if a task already exists for this date
  const { data: existingTask } = await supabase
    .from('tasks')
    .select('id')
    .eq('recurring_parent_id', parentTask.id)
    .eq('due_date', nextDueDateStr)
    .single()

  if (existingTask) {
    console.log(`Task already exists for ${nextDueDateStr} (parent: ${parentTask.id})`)
    return
  }

  // Create new recurring task
  const newTask = {
    title: `${parentTask.title} (${nextDueDate.toLocaleDateString()})`,
    description: parentTask.description,
    department: parentTask.department,
    priority: parentTask.priority,
    due_date: nextDueDateStr,
    status: 'not-started',
    is_recurring: false, // Child tasks are not recurring themselves
    assignee: parentTask.assignee,
    is_customer_related: parentTask.is_customer_related,
    customer_name: parentTask.customer_name,
    attachments_required: parentTask.attachments_required,
    approval_status: 'approved',
    recurring_parent_id: parentTask.id
  }

  const { error: insertError } = await supabase
    .from('tasks')
    .insert([newTask])

  if (insertError) {
    console.error(`Error creating recurring task for ${parentTask.id}:`, insertError)
  } else {
    console.log(`Created recurring task for ${nextDueDateStr} (parent: ${parentTask.id})`)
  }
}

function calculateNextDueDate(originalDueDate: string, frequency: string, today: Date): Date | null {
  const originalDate = new Date(originalDueDate)
  
  switch (frequency) {
    case 'daily':
      return new Date(today.getTime() + 24 * 60 * 60 * 1000) // Tomorrow
    case 'weekly':
      return new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) // Next week
    case 'bi-weekly':
      return new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000) // Two weeks
    case 'monthly':
      const nextMonth = new Date(today)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      return nextMonth
    case 'quarterly':
      const nextQuarter = new Date(today)
      nextQuarter.setMonth(nextQuarter.getMonth() + 3)
      return nextQuarter
    case 'annually':
      const nextYear = new Date(today)
      nextYear.setFullYear(nextYear.getFullYear() + 1)
      return nextYear
    default:
      return null
  }
}

function shouldCreateTaskForDate(frequency: string, originalDueDate: string, todayStr: string): boolean {
  const originalDate = new Date(originalDueDate)
  const today = new Date(todayStr)
  
  switch (frequency) {
    case 'daily':
      // Create task every day
      return true
    case 'weekly':
      // Create task if today is the same day of week as original
      return originalDate.getDay() === today.getDay()
    case 'bi-weekly':
      // Create task every 14 days from original date
      const daysDiff = Math.floor((today.getTime() - originalDate.getTime()) / (24 * 60 * 60 * 1000))
      return daysDiff > 0 && daysDiff % 14 === 0
    case 'monthly':
      // Create task if today is the same day of month as original
      return originalDate.getDate() === today.getDate()
    case 'quarterly':
      // Create task every 3 months on the same day
      return originalDate.getDate() === today.getDate() && 
             (today.getMonth() - originalDate.getMonth()) % 3 === 0
    case 'annually':
      // Create task if today is the same day and month as original
      return originalDate.getDate() === today.getDate() && 
             originalDate.getMonth() === today.getMonth()
    default:
      return false
  }
}
