
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Task automation started')
    
    const results = {
      overdueUpdated: 0,
      recurringCreated: 0,
      errors: []
    }

    // 1. Mark overdue tasks
    const today = new Date().toISOString().split('T')[0]
    
    const { data: overdueTasks, error: overdueError } = await supabase
      .from('tasks')
      .update({ status: 'overdue' })
      .lt('due_date', today)
      .in('status', ['not-started', 'in-progress'])
      .select('id, title')

    if (overdueError) {
      console.error('Error updating overdue tasks:', overdueError)
      results.errors.push(`Overdue update error: ${overdueError.message}`)
    } else if (overdueTasks) {
      results.overdueUpdated = overdueTasks.length
      console.log(`Marked ${overdueTasks.length} tasks as overdue`)
    }

    // 2. Handle recurring tasks - Find completed recurring tasks that need next instances
    const { data: completedRecurringTasks, error: recurringError } = await supabase
      .from('tasks')
      .select(`
        id, title, description, department, priority, assignee,
        is_recurring, recurring_frequency, start_date, end_date,
        is_customer_related, customer_name, attachments_required,
        due_date, status, parent_task_id, original_task_name
      `)
      .eq('status', 'completed')
      .eq('is_recurring', true)
      .is('parent_task_id', null) // Only parent tasks
      .not('recurring_frequency', 'is', null)

    if (recurringError) {
      console.error('Error fetching completed recurring tasks:', recurringError)
      results.errors.push(`Recurring fetch error: ${recurringError.message}`)
    } else if (completedRecurringTasks && completedRecurringTasks.length > 0) {
      console.log(`Found ${completedRecurringTasks.length} completed recurring tasks`)

      for (const task of completedRecurringTasks) {
        try {
          // Check if start_date is in the past
          const taskStartDate = new Date(task.start_date || task.due_date)
          const currentDate = new Date()
          
          if (taskStartDate < currentDate) {
            console.log(`Processing recurring task: ${task.title}`)
            
            // Use the database function to generate the next recurring task
            const { data: newTaskData, error: generateError } = await supabase
              .rpc('generate_next_recurring_task', { completed_task_id: task.id })

            if (generateError) {
              console.error(`Error generating next task for ${task.title}:`, generateError)
              results.errors.push(`Generate error for ${task.title}: ${generateError.message}`)
            } else if (newTaskData) {
              results.recurringCreated++
              console.log(`Generated next task ID ${newTaskData} for ${task.title}`)
              
              // Reset the parent task status to not-started for next cycle
              const { error: resetError } = await supabase
                .from('tasks')
                .update({ status: 'not-started' })
                .eq('id', task.id)
                
              if (resetError) {
                console.error(`Error resetting parent task status for ${task.title}:`, resetError)
              }
            } else {
              console.log(`No new task generated for ${task.title} (likely beyond end date or not due yet)`)
            }
          } else {
            console.log(`Task ${task.title} start date is not yet past, skipping`)
          }
        } catch (taskError) {
          console.error(`Error processing task ${task.id}:`, taskError)
          results.errors.push(`Task ${task.id} processing error: ${taskError.message}`)
        }
      }
    }

    // 3. Also check for completed child tasks that might need to trigger next instances
    const { data: completedChildTasks, error: childError } = await supabase
      .from('tasks')
      .select(`
        id, title, parent_task_id, start_date, due_date
      `)
      .eq('status', 'completed')
      .not('parent_task_id', 'is', null)

    if (!childError && completedChildTasks && completedChildTasks.length > 0) {
      for (const childTask of completedChildTasks) {
        try {
          // Get the parent task details
          const { data: parentTask, error: parentError } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', childTask.parent_task_id)
            .single()

          if (!parentError && parentTask && parentTask.is_recurring) {
            // Check if we need to generate the next instance
            const childStartDate = new Date(childTask.start_date || childTask.due_date)
            const currentDate = new Date()
            
            if (childStartDate < currentDate) {
              console.log(`Processing completed child task: ${childTask.title}`)
              
              const { data: newTaskData, error: generateError } = await supabase
                .rpc('generate_next_recurring_task', { completed_task_id: childTask.parent_task_id })

              if (generateError) {
                console.error(`Error generating next task for child ${childTask.title}:`, generateError)
              } else if (newTaskData) {
                results.recurringCreated++
                console.log(`Generated next task ID ${newTaskData} from child task ${childTask.title}`)
              }
            }
          }
        } catch (error) {
          console.error(`Error processing child task ${childTask.id}:`, error)
        }
      }
    }

    console.log('Task automation completed:', results)

    return new Response(JSON.stringify({
      success: true,
      message: 'Task automation completed successfully',
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Task automation error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
