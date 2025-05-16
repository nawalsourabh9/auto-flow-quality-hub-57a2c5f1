
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
      console.log("Assignee value from form:", updatedTask.assignee, typeof updatedTask.assignee);
      
      // Determine the actual assignee value to store in database
      // Now explicitly convert "unassigned" to null
      let assigneeValue: string | null = null;
      
      if (updatedTask.assignee && updatedTask.assignee !== "unassigned") {
        assigneeValue = updatedTask.assignee;
        console.log("Setting assignee to:", assigneeValue);
      } else {
        console.log("Setting assignee to null");
      }
      
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
        assignee: assigneeValue
      };
      
      console.log("Final update payload before sending to database:", updatePayload);
      console.log("Assignee type:", typeof updatePayload.assignee);

      // Log the actual query that will be executed
      console.log("Executing update query with assignee:", updatePayload.assignee);

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
