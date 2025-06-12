
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

    // 2. Handle recurring tasks - Use the database function for proper generation
    const { data: completedRecurringTasks, error: recurringError } = await supabase
      .from('tasks')
      .select(`
        id, title, description, department, priority, assignee,
        is_recurring, recurring_frequency, start_date, end_date,
        is_customer_related, customer_name, attachments_required,
        due_date, status, parent_task_id
      `)
      .eq('status', 'completed')
      .or('is_recurring.eq.true,parent_task_id.not.is.null')
      .not('recurring_frequency', 'is', null)

    if (recurringError) {
      console.error('Error fetching completed recurring tasks:', recurringError)
      results.errors.push(`Recurring fetch error: ${recurringError.message}`)
    } else if (completedRecurringTasks && completedRecurringTasks.length > 0) {
      console.log(`Found ${completedRecurringTasks.length} completed recurring tasks`)

      for (const task of completedRecurringTasks) {
        try {
          // Use the database function to generate the next recurring task
          const { data: newTaskData, error: generateError } = await supabase
            .rpc('generate_next_recurring_task', { completed_task_id: task.id })

          if (generateError) {
            console.error(`Error generating next task for ${task.title}:`, generateError)
            results.errors.push(`Generate error for ${task.title}: ${generateError.message}`)
          } else if (newTaskData) {
            results.recurringCreated++
            console.log(`Generated next task ${newTaskData} for ${task.title}`)
          } else {
            console.log(`No new task generated for ${task.title} (likely beyond end date or too early)`)
          }
        } catch (taskError) {
          console.error(`Error processing task ${task.id}:`, taskError)
          results.errors.push(`Task ${task.id} processing error: ${taskError.message}`)
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
