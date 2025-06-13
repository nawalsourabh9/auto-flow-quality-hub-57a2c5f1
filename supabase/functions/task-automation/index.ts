
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

    // Get current IST time
    const now = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
    const istNow = new Date(now.getTime() + istOffset)
    const today = istNow.toISOString().split('T')[0]
    
    console.log('Current IST date:', today)    // 1. Mark overdue tasks using smart frequency-based logic
    const { data: overdueResult, error: overdueError } = await supabase
      .rpc('mark_tasks_overdue')

    if (overdueError) {
      console.error('Error updating overdue tasks:', overdueError)
      results.errors.push(`Overdue update error: ${overdueError.message}`)
    } else if (overdueResult) {
      results.overdueUpdated = overdueResult
      console.log(`Marked ${overdueResult} tasks as overdue using smart frequency logic`)
    }

    // 2. Handle recurring tasks - Find completed tasks that might need processing
    const { data: completedTasks, error: completedError } = await supabase
      .from('tasks')
      .select(`
        id, title, description, department, priority, assignee,
        is_recurring, recurring_frequency, start_date, end_date,
        is_customer_related, customer_name, attachments_required,
        due_date, status, parent_task_id, original_task_name,
        recurrence_count_in_period
      `)
      .eq('status', 'completed')

    if (completedError) {
      console.error('Error fetching completed tasks:', completedError)
      results.errors.push(`Completed tasks fetch error: ${completedError.message}`)
    } else if (completedTasks && completedTasks.length > 0) {
      console.log(`Found ${completedTasks.length} completed tasks to process`)

      // Track processed tasks to avoid duplicates
      const processedTasks = new Set<string>()

      for (const task of completedTasks) {
        try {
          // Skip if already processed
          if (processedTasks.has(task.id)) {
            console.log(`Task ${task.id} already processed, skipping`)
            continue
          }

          // Check if this task can trigger recurring generation
          let shouldProcess = false
          
          if (task.is_recurring && !task.parent_task_id) {
            // This is a parent recurring task
            shouldProcess = true
            console.log(`Processing parent recurring task: ${task.title}`)
          } else if (task.parent_task_id) {
            // This is a child task - get parent to check if it's recurring
            const { data: parentTask } = await supabase
              .from('tasks')
              .select('is_recurring, recurring_frequency')
              .eq('id', task.parent_task_id)
              .single()
              
            if (parentTask && parentTask.is_recurring) {
              shouldProcess = true
              console.log(`Processing child task of recurring parent: ${task.title}`)
            }
          }
          
          if (shouldProcess) {
            console.log(`Attempting to generate next task for: ${task.title}`)

            // Use the completed task ID to trigger next instance generation via RPC
            const { data: newTaskData, error: generateError } = await supabase
              .rpc('generate_next_recurring_task', { completed_task_id: task.id })

            if (generateError) {
              console.error(`Error generating next task for ${task.title}:`, generateError)
              results.errors.push(`Generate error for ${task.title}: ${generateError.message}`)
            } else if (newTaskData) {
              results.recurringCreated++
              console.log(`Generated next task ID ${newTaskData} for ${task.title}`)

              // If this was a parent task, reset its status for next cycle
              if (task.is_recurring && !task.parent_task_id) {
                const { error: resetError } = await supabase
                  .from('tasks')
                  .update({ status: 'not-started' })
                  .eq('id', task.id)

                if (resetError) {
                  console.error(`Error resetting parent task status for ${task.title}:`, resetError)
                } else {
                  console.log(`Reset parent task status for ${task.title}`)
                }
              }
            } else {
              console.log(`No new task generated for ${task.title} (conditions not met or duplicate prevented)`)
            }

            // Mark as processed
            processedTasks.add(task.id)
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
