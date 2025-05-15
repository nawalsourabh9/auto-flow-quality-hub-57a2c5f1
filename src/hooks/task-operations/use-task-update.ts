
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";
import { toast } from "@/hooks/use-toast";

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
  attachments_required: 'none' | 'optional' | 'required';
  assignee: string | null;
}

/**
 * Hook for task update operations
 */
export const useTaskUpdate = (setIsEditDialogOpen: (isOpen: boolean) => void) => {
  const queryClient = useQueryClient();

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      console.log("Updating task:", updatedTask);
      console.log("Assignee value:", updatedTask.assignee, typeof updatedTask.assignee);
      
      // Create the update payload with proper typing
      const updatePayload: TaskUpdatePayload = {
        title: updatedTask.title,
        description: updatedTask.description || null,
        department: updatedTask.department,
        priority: updatedTask.priority,
        due_date: updatedTask.dueDate || null,
        is_recurring: updatedTask.isRecurring || false,
        is_customer_related: updatedTask.isCustomerRelated || false,
        customer_name: updatedTask.customerName || null,
        recurring_frequency: updatedTask.recurringFrequency || null,
        attachments_required: updatedTask.attachmentsRequired,
        assignee: updatedTask.assignee === "unassigned" ? null : updatedTask.assignee
      };
      
      console.log("Final update payload:", updatePayload);

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
