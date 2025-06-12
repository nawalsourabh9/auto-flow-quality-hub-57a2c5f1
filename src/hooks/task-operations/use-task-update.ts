
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
      
      // Format all dates consistently
      const formattedDueDate = formatDateForInput(updatedTask.dueDate);
      const formattedStartDate = updatedTask.startDate ? formatDateForInput(updatedTask.startDate) : null;
      const formattedEndDate = updatedTask.endDate ? formatDateForInput(updatedTask.endDate) : null;
      
      console.log("Formatted dates for database:", {
        original: { due: updatedTask.dueDate, start: updatedTask.startDate, end: updatedTask.endDate },
        formatted: { due: formattedDueDate, start: formattedStartDate, end: formattedEndDate }
      });
      
      // assignee is already properly converted at the form level
      const assigneeValue = updatedTask.assignee === "unassigned" ? null : updatedTask.assignee;
      
      // Create the update payload with proper typing and formatted dates
      const updatePayload: TaskUpdatePayload = {
        title: updatedTask.title,
        description: updatedTask.description || null,
        department: updatedTask.department,
        priority: updatedTask.priority,
        due_date: formattedDueDate || null,
        is_recurring: updatedTask.isRecurring || false,
        is_customer_related: updatedTask.isCustomerRelated || false,
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
      
      console.log("Final update payload with enhanced recurring fields:", updatePayload);

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
        console.log("Task marked as completed, triggering recurring task generation");
        
        // Try to generate next recurring task using the database function
        try {
          console.log("Calling generate_next_recurring_task with task ID:", updatedTask.id);
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
              description: `Task completed and new recurring instance generated (ID: ${newTaskId})`,
            });
          } else {
            console.log("No new recurring task generated (conditions not met)");
            toast({
              title: "Task Updated",
              description: "Task marked as completed. No new recurring instance needed.",
            });
          }
        } catch (recurringError) {
          console.error("Exception generating recurring task:", recurringError);
          toast({
            title: "Warning", 
            description: "Task updated but recurring task generation encountered an error",
            variant: "destructive"
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
