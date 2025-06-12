
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

export const useTaskUpdate = (setIsEditDialogOpen: (isOpen: boolean) => void) => {
  const queryClient = useQueryClient();
  const { processTaskDocuments } = useTaskDocumentUpload();

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      console.log("Task update: Starting with task ID:", updatedTask.id);
      
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

      // Format dates consistently
      const formattedDueDate = updatedTask.dueDate ? formatDateForInput(updatedTask.dueDate) : null;
      const formattedStartDate = updatedTask.startDate ? formatDateForInput(updatedTask.startDate) : null;
      const formattedEndDate = updatedTask.endDate ? formatDateForInput(updatedTask.endDate) : null;
      
      // Create update payload with only changed fields
      const updatePayload: TaskUpdatePayload = {};
      
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
      
      const assigneeValue = updatedTask.assignee === "unassigned" ? null : updatedTask.assignee;
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
      
      // Handle recurring task fields
      if (Boolean(updatedTask.isRecurring) !== Boolean(originalTaskData.is_recurring)) {
        updatePayload.is_recurring = Boolean(updatedTask.isRecurring);
        
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
      
      // Handle customer related fields
      if (Boolean(updatedTask.isCustomerRelated) !== Boolean(originalTaskData.is_customer_related)) {
        updatePayload.is_customer_related = Boolean(updatedTask.isCustomerRelated);
        updatePayload.customer_name = updatedTask.isCustomerRelated ? (updatedTask.customerName || null) : null;
      } else if (updatedTask.isCustomerRelated && updatedTask.customerName !== originalTaskData.customer_name) {
        updatePayload.customer_name = updatedTask.customerName || null;
      }
      
      console.log("Task update: Payload with changed fields:", updatePayload);

      // Only proceed if there are actual changes
      if (Object.keys(updatePayload).length === 0) {
        console.log("Task update: No changes detected");
        toast({
          title: "No Changes",
          description: "No changes were detected in the task.",
        });
        setIsEditDialogOpen(false);
        return;
      }

      // Update the task
      const { data, error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', updatedTask.id)
        .select();

      if (error) {
        console.error("Task update: Database error:", error);
        throw error;
      }

      console.log("Task update: Successfully updated:", data);

      // Handle completion and recurring task generation
      const statusChangedToCompleted = originalTaskData.status !== 'completed' && updatedTask.status === 'completed';
      
      if (statusChangedToCompleted) {
        console.log("Task update: Status changed to completed, attempting recurring generation");
        
        const isRecurringCandidate = originalTaskData.is_recurring || originalTaskData.parent_task_id;
        
        if (isRecurringCandidate) {
          try {
            console.log("Task update: Calling generate_next_recurring_task");
            
            const { data: newTaskId, error: recurringError } = await supabase
              .rpc('generate_next_recurring_task', { completed_task_id: updatedTask.id });

            if (recurringError) {
              console.error("Task update: Recurring generation error:", recurringError);
              toast({
                title: "Warning",
                description: `Task updated but recurring generation failed: ${recurringError.message}`,
                variant: "destructive"
              });
            } else if (newTaskId) {
              console.log("Task update: Generated new recurring task:", newTaskId);
              toast({
                title: "Success",
                description: "Task completed and new recurring instance generated!",
              });
            } else {
              console.log("Task update: No new recurring task generated (conditions not met)");
              toast({
                title: "Task Completed",
                description: "Task marked as completed.",
              });
            }
          } catch (recurringError) {
            console.error("Task update: Exception in recurring generation:", recurringError);
            toast({
              title: "Warning", 
              description: "Task updated but recurring generation encountered an error",
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Task Completed",
            description: "Task marked as completed.",
          });
        }
      } else {
        toast({
          title: "Task Updated",
          description: `Task "${updatedTask.title}" has been updated successfully.`
        });
      }
      
      // Process document uploads if any
      if (updatedTask.documents && updatedTask.documents.length > 0) {
        console.log("Task update: Processing document uploads");
        await processTaskDocuments(updatedTask.id, updatedTask.documents);
      }

      // Refresh the tasks list
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsEditDialogOpen(false);
      
    } catch (error: any) {
      console.error('Task update failed:', error);
      toast({
        title: "Error",
        description: `Failed to update task: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  return { handleUpdateTask };
};
