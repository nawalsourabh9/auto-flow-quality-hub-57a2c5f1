
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";
import { toast } from "@/hooks/use-toast";
import { useTaskDocumentUpload } from "@/hooks/use-task-document-upload";
import { formatDateForInput } from "@/utils/dateUtils";

interface TaskUpdatePayload {
  title?: string;
  description?: string | null;
  department?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string | null;
  is_recurring?: boolean;
  is_customer_related?: boolean;
  customer_name?: string | null;
  recurring_frequency?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  attachments_required?: 'none' | 'optional' | 'required';
  assignee?: string | null;
  status?: 'not-started' | 'in-progress' | 'completed' | 'overdue';
  comments?: string | null;
  original_task_name?: string | null;
}

// Type for the database function response
interface CompleteTaskResponse {
  success: boolean;
  completed_task_id?: string;
  new_recurring_task_id?: string | null;
  message?: string;
  error?: string;
}

export const useTaskUpdate = (setIsEditDialogOpen: (isOpen: boolean) => void) => {
  const queryClient = useQueryClient();
  const { processTaskDocuments } = useTaskDocumentUpload();

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      console.log("useTaskUpdate: Starting task update with task ID:", updatedTask.id);
      console.log("useTaskUpdate: Task object keys:", Object.keys(updatedTask));
      
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
      
      // Create a minimal update payload with only the fields that can be updated
      const updatePayload: TaskUpdatePayload = {};
      
      // Only include fields that have actually changed and are safe to update
      if (updatedTask.title !== originalTaskData.title) {
        updatePayload.title = updatedTask.title;
      }
      
      if (updatedTask.description !== originalTaskData.description) {
        updatePayload.description = updatedTask.description || null;
      }
      
      if (updatedTask.department !== originalTaskData.department) {
        updatePayload.department = updatedTask.department;
      }
      
      if (updatedTask.priority !== originalTaskData.priority) {
        updatePayload.priority = updatedTask.priority;
      }
      
      if (formattedDueDate !== originalTaskData.due_date) {
        updatePayload.due_date = formattedDueDate;
      }
      
      if (assigneeValue !== originalTaskData.assignee) {
        updatePayload.assignee = assigneeValue;
      }
      
      if (updatedTask.status !== originalTaskData.status) {
        updatePayload.status = updatedTask.status;
      }
      
      if (updatedTask.comments !== originalTaskData.comments) {
        updatePayload.comments = updatedTask.comments || null;
      }
      
      if (updatedTask.attachmentsRequired !== originalTaskData.attachments_required) {
        updatePayload.attachments_required = updatedTask.attachmentsRequired;
      }
      
      if (Boolean(updatedTask.isRecurring) !== Boolean(originalTaskData.is_recurring)) {
        updatePayload.is_recurring = Boolean(updatedTask.isRecurring);
        
        // Only update recurring-related fields if the task is recurring
        if (updatedTask.isRecurring) {
          updatePayload.recurring_frequency = updatedTask.recurringFrequency || null;
          updatePayload.start_date = formattedStartDate;
          updatePayload.end_date = formattedEndDate;
          updatePayload.original_task_name = updatedTask.originalTaskName || updatedTask.title;
        } else {
          updatePayload.recurring_frequency = null;
          updatePayload.start_date = null;
          updatePayload.end_date = null;
          updatePayload.original_task_name = null;
        }
      } else if (updatedTask.isRecurring) {
        // Update recurring fields if they changed
        if (updatedTask.recurringFrequency !== originalTaskData.recurring_frequency) {
          updatePayload.recurring_frequency = updatedTask.recurringFrequency || null;
        }
        if (formattedStartDate !== originalTaskData.start_date) {
          updatePayload.start_date = formattedStartDate;
        }
        if (formattedEndDate !== originalTaskData.end_date) {
          updatePayload.end_date = formattedEndDate;
        }
      }
      
      if (Boolean(updatedTask.isCustomerRelated) !== Boolean(originalTaskData.is_customer_related)) {
        updatePayload.is_customer_related = Boolean(updatedTask.isCustomerRelated);
        updatePayload.customer_name = updatedTask.isCustomerRelated ? (updatedTask.customerName || null) : null;
      } else if (updatedTask.isCustomerRelated && updatedTask.customerName !== originalTaskData.customer_name) {
        updatePayload.customer_name = updatedTask.customerName || null;
      }
      
      console.log("useTaskUpdate: Final update payload (only changed fields):", updatePayload);

      // Only proceed with update if there are actual changes
      if (Object.keys(updatePayload).length === 0) {
        console.log("useTaskUpdate: No changes detected, skipping database update");
        toast({
          title: "No Changes",
          description: "No changes were detected in the task.",
        });
        setIsEditDialogOpen(false);
        return;
      }

      // Check if status is changing to completed and this is a recurring task
      const isMarkingAsCompleted = originalTaskData.status !== 'completed' && updatedTask.status === 'completed';
      const isRecurringCandidate = originalTaskData.is_recurring || originalTaskData.parent_task_id;
      
      if (isMarkingAsCompleted && isRecurringCandidate) {
        console.log("useTaskUpdate: Task being marked as completed, using secure completion function");
        
        try {
          // Use the new complete_task_and_generate_next function
          const { data: result, error: recurringError } = await supabase
            .rpc('complete_task_and_generate_next', { task_id: updatedTask.id });

          if (recurringError) {
            console.error("useTaskUpdate: Task completion error:", recurringError);
            toast({
              title: "Error",
              description: `Task completion failed: ${recurringError.message}`,
              variant: "destructive"
            });
            throw recurringError;
          } else {
            // Type assertion for the response - convert through unknown first
            const typedResult = result as unknown as CompleteTaskResponse;
            
            if (typedResult?.success) {
              if (typedResult.new_recurring_task_id) {
                console.log("useTaskUpdate: Generated new recurring task:", typedResult.new_recurring_task_id);
                toast({
                  title: "Success",
                  description: `Task completed and new recurring instance generated!`,
                });
              } else {
                console.log("useTaskUpdate: Task completed, no recurring generation needed");
                toast({
                  title: "Success",
                  description: "Task marked as completed.",
                });
              }
              // Refresh the tasks list immediately to show the new task
              await queryClient.invalidateQueries({ queryKey: ['tasks'] });
            } else {
              console.log("useTaskUpdate: Function returned false success");
              toast({
                title: "Warning",
                description: typedResult?.message || "Task completion had issues",
                variant: "destructive"
              });
            }
          }
          
        } catch (error) {
          console.error("useTaskUpdate: Exception in recurring completion:", error);
          toast({
            title: "Error", 
            description: "Task completion encountered an error",
            variant: "destructive"
          });
          throw error;
        }
      } else {
        // For non-completion updates, use the normal update process
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

      // Invalidate the tasks query to refetch data (only if not already done above)
      if (!(isMarkingAsCompleted && isRecurringCandidate)) {
        await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }

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
