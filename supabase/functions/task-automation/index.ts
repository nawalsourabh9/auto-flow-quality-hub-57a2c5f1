
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
      errors: [] as string[]
    }

    // Get current IST time
    const now = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
    const istNow = new Date(now.getTime() + istOffset)
    const today = istNow.toISOString().split('T')[0]
    
    console.log('Current IST date:', today)    // 1. Mark overdue tasks using template-aware logic (excludes templates)
    const { data: overdueResult, error: overdueError } = await supabase
      .rpc('mark_tasks_overdue_simple')

    if (overdueError) {
      console.error('Error updating overdue tasks:', overdueError)
      results.errors.push(`Overdue update error: ${overdueError.message}`)
    } else if (overdueResult) {
      results.overdueUpdated = overdueResult
      console.log(`Marked ${overdueResult} instance tasks as overdue (templates excluded)`)
    }

    // 2. Handle recurring tasks - Find completed instances that can generate next tasks
    const { data: completedInstances, error: completedError } = await supabase
      .from('tasks')
      .select(`
        id, title, description, department, priority, assignee,
        is_recurring, recurring_frequency, start_date, end_date,
        is_customer_related, customer_name, attachments_required,
        due_date, status, parent_task_id, original_task_name,
        recurrence_count_in_period, is_template, is_generated
      `)
      .eq('status', 'completed')
      .eq('is_template', false)
      .eq('is_generated', true)
      .not('parent_task_id', 'is', null)

    if (completedError) {
      console.error('Error fetching completed instances:', completedError)
      results.errors.push(`Completed instances fetch error: ${completedError.message}`)
    } else if (completedInstances && completedInstances.length > 0) {
      console.log(`Found ${completedInstances.length} completed instances to process`)

      // Track processed tasks to avoid duplicates
      const processedTasks = new Set<string>()

      for (const task of completedInstances) {        try {
          // Skip if already processed
          if (processedTasks.has(task.id)) {
            console.log(`Task ${task.id} already processed, skipping`)
            continue
          }

          // This is a completed instance from a template - process it
          console.log(`Processing completed instance: ${task.title}`)
          
          console.log(`Attempting to generate next task for: ${task.title}`)            
            // Use the secure wrapper function for completion and generation
          const { data: result, error: generateError } = await supabase
            .rpc('complete_task_and_generate_next', { task_id: task.id })
            
          if (generateError) {
            console.error(`Error generating next task for ${task.title}:`, generateError)
            results.errors.push(`Generate error for ${task.title}: ${generateError.message}`)
          } else if (result?.success) {
            if (result.new_recurring_task_id) {
              results.recurringCreated++
              console.log(`Generated next task ID ${result.new_recurring_task_id} for ${task.title}`)
            } else {
              console.log(`Task ${task.title} completed, no recurring generation needed`)
            }
          } else {
            console.log(`No new task generated for ${task.title}: ${result?.message || 'Unknown reason'}`)
          }

          // Mark as processed
          processedTasks.add(task.id)
        } catch (taskError: any) {
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
