
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
    
    console.log('Current IST date:', today)

    // 1. Mark overdue tasks
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

    // 2. Handle recurring tasks - Find all completed tasks (both parent and child) that might need processing
    const { data: completedTasks, error: completedError } = await supabase
      .from('tasks')
      .select(`
        id, title, description, department, priority, assignee,
        is_recurring, recurring_frequency, start_date, end_date,
        is_customer_related, customer_name, attachments_required,
        due_date, status, parent_task_id, original_task_name
      `)
      .eq('status', 'completed')

    if (completedError) {
      console.error('Error fetching completed tasks:', completedError)
      results.errors.push(`Completed tasks fetch error: ${completedError.message}`)
    } else if (completedTasks && completedTasks.length > 0) {
      console.log(`Found ${completedTasks.length} completed tasks to process`)

      for (const task of completedTasks) {
        try {
          // Check if this task can trigger recurring generation
          let shouldProcess = false
          let taskStartDate: Date
          
          if (task.is_recurring && !task.parent_task_id) {
            // This is a parent recurring task
            shouldProcess = true
            taskStartDate = new Date(task.start_date || task.due_date)
          } else if (task.parent_task_id) {
            // This is a child task - get parent to check if it's recurring
            const { data: parentTask } = await supabase
              .from('tasks')
              .select('is_recurring, recurring_frequency')
              .eq('id', task.parent_task_id)
              .single()
              
            if (parentTask && parentTask.is_recurring) {
              shouldProcess = true
              taskStartDate = new Date(task.start_date || task.due_date)
            }
          }
          
          if (shouldProcess) {
            const currentISTDate = new Date(istNow)
            
            // Check if current date is greater than start date by at least 1 day
            const daysDifference = Math.floor((currentISTDate.getTime() - taskStartDate.getTime()) / (1000 * 60 * 60 * 24))
            
            if (daysDifference >= 1) {
              console.log(`Processing task: ${task.title}, days difference: ${daysDifference}`)
              
              // Use the completed task ID (whether parent or child) to generate next instance
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
                console.log(`No new task generated for ${task.title} (conditions not met)`)
              }
            } else {
              console.log(`Task ${task.title} does not meet the 1-day criteria, skipping (days difference: ${daysDifference})`)
            }
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
