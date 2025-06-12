
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";
import { toast } from "@/hooks/use-toast";
import { useTaskDocumentUpload } from "@/hooks/use-task-document-upload";
import { formatDateForInput } from "@/utils/dateUtils";

interface TaskUpdatePayload {
  title: string;
  description: string | null;
  department: string;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  is_recurring: boolean;
  is_customer_related: boolean;
  customer_name?: string | null;
  recurring_frequency?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  attachments_required: 'none' | 'optional' | 'required';
  assignee: string | null;
  status?: 'not-started' | 'in-progress' | 'completed' | 'overdue';
  comments?: string | null;
  original_task_name?: string | null;
}

export const useTaskUpdate = (setIsEditDialogOpen: (isOpen: boolean) => void) => {
  const queryClient = useQueryClient();
  const { processTaskDocuments } = useTaskDocumentUpload();

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      console.log("useTaskUpdate: Starting task update with clean data:", {
        id: updatedTask.id,
        status: updatedTask.status,
        hasRecurrenceCount: 'recurrenceCountInPeriod' in updatedTask,
        taskKeys: Object.keys(updatedTask)
      });
      
      // Get original task data to compare changes
      const { data: originalTaskData, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', updatedTask.id)
        .single();

      if (fetchError) {
        console.error("Error fetching original task:", fetchError);
        throw fetchError;
      }

      // Convert original task data to Task format for comparison - EXCLUDE problematic fields
      const originalTask: Task = {
        id: originalTaskData.id,
        title: originalTaskData.title,
        description: originalTaskData.description,
        department: originalTaskData.department,
        priority: originalTaskData.priority as 'low' | 'medium' | 'high',
        dueDate: originalTaskData.due_date,
        assignee: originalTaskData.assignee,
        status: originalTaskData.status as 'completed' | 'in-progress' | 'overdue' | 'not-started',
        createdAt: originalTaskData.created_at,
        isRecurring: originalTaskData.is_recurring,
        recurringFrequency: originalTaskData.recurring_frequency,
        startDate: originalTaskData.start_date,
        endDate: originalTaskData.end_date,
        isCustomerRelated: originalTaskData.is_customer_related,
        customerName: originalTaskData.customer_name,
        attachmentsRequired: originalTaskData.attachments_required as 'none' | 'optional' | 'required',
        parentTaskId: originalTaskData.parent_task_id,
        originalTaskName: originalTaskData.original_task_name
        // NOTE: Intentionally excluding recurrenceCountInPeriod
      };
      
      // Format all dates consistently as YYYY-MM-DD strings
      const formattedDueDate = updatedTask.dueDate ? formatDateForInput(updatedTask.dueDate) : null;
      const formattedStartDate = updatedTask.startDate ? formatDateForInput(updatedTask.startDate) : null;
      const formattedEndDate = updatedTask.endDate ? formatDateForInput(updatedTask.endDate) : null;
      
      console.log("useTaskUpdate: Formatted dates for database:", {
        original: { due: updatedTask.dueDate, start: updatedTask.startDate, end: updatedTask.endDate },
        formatted: { due: formattedDueDate, start: formattedStartDate, end: formattedEndDate }
      });
      
      // Ensure assignee is properly converted
      const assigneeValue = updatedTask.assignee === "unassigned" ? null : updatedTask.assignee;
      
      // Create the update payload with strict type checking - NEVER include recurrenceCountInPeriod
      const updatePayload: TaskUpdatePayload = {
        title: updatedTask.title,
        description: updatedTask.description || null,
        department: updatedTask.department,
        priority: updatedTask.priority,
        due_date: formattedDueDate,
        is_recurring: Boolean(updatedTask.isRecurring),
        is_customer_related: Boolean(updatedTask.isCustomerRelated),
        customer_name: updatedTask.customerName || null,
        recurring_frequency: updatedTask.isRecurring ? updatedTask.recurringFrequency || null : null,
        start_date: updatedTask.isRecurring ? formattedStartDate : null,
        end_date: updatedTask.isRecurring ? formattedEndDate : null,
        attachments_required: updatedTask.attachmentsRequired,
        assignee: assigneeValue,
        status: updatedTask.status,
        comments: updatedTask.comments || null,
        original_task_name: updatedTask.isRecurring ? (updatedTask.originalTaskName || updatedTask.title) : null
        // NOTE: recurrenceCountInPeriod is NEVER included - backend manages this
      };
      
      console.log("useTaskUpdate: Final update payload (guaranteed no recurrenceCountInPeriod):", {
        ...updatePayload,
        hasRecurrenceCount: 'recurrence_count_in_period' in updatePayload
      });

      // Update the task with the properly constructed payload
      const { data, error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', updatedTask.id)
        .select();

      if (error) {
        console.error("useTaskUpdate: Database update error:", error);
        throw error;
      }

      console.log("useTaskUpdate: Task updated successfully:", data);

      // Check if status changed to completed and handle recurring task generation
      if (originalTask.status !== 'completed' && updatedTask.status === 'completed') {
        console.log("useTaskUpdate: Task marked as completed, checking recurring generation");
        
        // Only try to generate next recurring task if this is a recurring task or task instance
        const isRecurringCandidate = originalTask.isRecurring || originalTask.parentTaskId;
        
        if (isRecurringCandidate) {
          console.log("useTaskUpdate: Triggering recurring task generation");
          
          try {
            // Use a timeout to prevent multiple rapid calls
            setTimeout(async () => {
              const { data: newTaskId, error: recurringError } = await supabase
                .rpc('generate_next_recurring_task', { completed_task_id: updatedTask.id });

              if (recurringError) {
                console.error("useTaskUpdate: Recurring generation error:", recurringError);
                toast({
                  title: "Warning",
                  description: `Task updated but recurring task generation failed: ${recurringError.message}`,
                  variant: "destructive"
                });
              } else if (newTaskId) {
                console.log("useTaskUpdate: Generated new recurring task:", newTaskId);
                toast({
                  title: "Success",
                  description: `Task completed and new recurring instance generated!`,
                });
                // Refresh the tasks list to show the new task
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
              } else {
                console.log("useTaskUpdate: No new recurring task generated");
                toast({
                  title: "Task Updated",
                  description: "Task marked as completed.",
                });
              }
            }, 500);
            
          } catch (recurringError) {
            console.error("useTaskUpdate: Exception in recurring generation:", recurringError);
            toast({
              title: "Warning", 
              description: "Task updated but recurring task generation encountered an error",
              variant: "destructive"
            });
          }
        } else {
          console.log("useTaskUpdate: Task is not recurring, no generation needed");
          toast({
            title: "Task Updated",
            description: "Task marked as completed.",
          });
        }
      } else {
        // Show normal success message for non-completion updates
        toast({
          title: "Task Updated",
          description: `Task "${updatedTask.title}" has been updated successfully.`
        });
      }
      
      // Process document uploads if any
      if (updatedTask.documents && updatedTask.documents.length > 0) {
        console.log("useTaskUpdate: Processing document uploads");
        await processTaskDocuments(updatedTask.id, updatedTask.documents);
      }

      // Invalidate the tasks query to refetch data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error('useTaskUpdate: Task update failed:', error);
      toast({
        title: "Error",
        description: `Failed to update task: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  return { handleUpdateTask };
};
