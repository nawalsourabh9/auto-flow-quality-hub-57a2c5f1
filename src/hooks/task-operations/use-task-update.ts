
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";
import { toast } from "@/hooks/use-toast";

/**
 * Hook for task update operations
 */
export const useTaskUpdate = (setIsEditDialogOpen: (isOpen: boolean) => void) => {
  const queryClient = useQueryClient();

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      console.log("Updating task:", updatedTask);
      
      // Create the update payload
      const updatePayload: Record<string, any> = {
        title: updatedTask.title,
        description: updatedTask.description,
        department: updatedTask.department,
        priority: updatedTask.priority,
        due_date: updatedTask.dueDate,
        is_recurring: updatedTask.isRecurring || false,
        is_customer_related: updatedTask.isCustomerRelated || false,
        customer_name: updatedTask.customerName,
        recurring_frequency: updatedTask.recurringFrequency,
        attachments_required: updatedTask.attachmentsRequired
      };
      
      // Important: Handle assignee field carefully
      if (updatedTask.assignee === "unassigned") {
        updatePayload.assignee = null; // This ensures NULL is stored in the database
        console.log("Setting assignee to NULL (unassigned)");
      } else {
        updatePayload.assignee = updatedTask.assignee; // Store the employee ID
        console.log("Setting assignee to:", updatedTask.assignee);
      }

      // Update the task with the properly constructed payload
      const { error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', updatedTask.id);

      if (error) {
        console.error("Update error:", error);
        throw error;
      }

      // Invalidate the tasks query to refetch data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      toast({
        title: "Task Updated",
        description: `Task "${updatedTask.title}" has been updated successfully.`
      });

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
