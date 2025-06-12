
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
      console.log("Updating task with enhanced recurring support:", updatedTask);
      
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

      // Convert original task data to Task format for comparison
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
      };
      
      // Format all dates consistently as YYYY-MM-DD strings
      const formattedDueDate = updatedTask.dueDate ? formatDateForInput(updatedTask.dueDate) : null;
      const formattedStartDate = updatedTask.startDate ? formatDateForInput(updatedTask.startDate) : null;
      const formattedEndDate = updatedTask.endDate ? formatDateForInput(updatedTask.endDate) : null;
      
      console.log("Formatted dates for database:", {
        original: { due: updatedTask.dueDate, start: updatedTask.startDate, end: updatedTask.endDate },
        formatted: { due: formattedDueDate, start: formattedStartDate, end: formattedEndDate }
      });
      
      // Ensure assignee is properly converted
      const assigneeValue = updatedTask.assignee === "unassigned" ? null : updatedTask.assignee;
      
      // Create the update payload with strict type checking to prevent string/integer conflicts
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
      };
      
      console.log("Final update payload with strict typing:", updatePayload);

      // Update the task with the properly constructed payload
      const { data, error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', updatedTask.id)
        .select();

      if (error) {
        console.error("Update error:", error);
        throw error;
      }

      console.log("Task updated successfully:", data);

      // Check if status changed to completed and handle recurring task generation
      if (originalTask.status !== 'completed' && updatedTask.status === 'completed') {
        console.log("Task marked as completed, checking if recurring task generation is needed");
        
        // Only try to generate next recurring task if this is a recurring task or task instance
        const isRecurringCandidate = originalTask.isRecurring || originalTask.parentTaskId;
        
        if (isRecurringCandidate) {
          console.log("Task is a recurring candidate. Triggering recurring task generation with task ID:", updatedTask.id);
          
          try {
            // Use a timeout to prevent multiple rapid calls
            setTimeout(async () => {
              const { data: newTaskId, error: recurringError } = await supabase
                .rpc('generate_next_recurring_task', { completed_task_id: updatedTask.id });

              if (recurringError) {
                console.error("Error generating recurring task:", recurringError);
                toast({
                  title: "Warning",
                  description: `Task updated but recurring task generation failed: ${recurringError.message}`,
                  variant: "destructive"
                });
              } else if (newTaskId) {
                console.log("Generated new recurring task with ID:", newTaskId);
                toast({
                  title: "Success",
                  description: `Task completed and new recurring instance generated!`,
                });
                // Refresh the tasks list to show the new task
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
              } else {
                console.log("No new recurring task generated (conditions not met or already exists)");
                toast({
                  title: "Task Updated",
                  description: "Task marked as completed.",
                });
              }
            }, 500); // 500ms delay to prevent rapid successive calls
            
          } catch (recurringError) {
            console.error("Exception generating recurring task:", recurringError);
            toast({
              title: "Warning", 
              description: "Task updated but recurring task generation encountered an error",
              variant: "destructive"
            });
          }
        } else {
          console.log("Task is not a recurring task or instance. No generation needed.");
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
        console.log("Processing document uploads for updated task");
        await processTaskDocuments(updatedTask.id, updatedTask.documents);
      } else {
        console.log("No documents to process for updated task");
      }

      // Invalidate the tasks query to refetch data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: `Failed to update task: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  return { handleUpdateTask };
};
