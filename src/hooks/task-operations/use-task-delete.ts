
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const useTaskDelete = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();  const deleteTask = async (taskId: string, deleteWithChildren: boolean = false) => {
    if (!taskId) return false;
    
    try {
      setIsDeleting(true);
      console.log(`Attempting to delete task with ID: ${taskId}`);
      
      // First, check if this task has child tasks (recurring instances)
      const { data: childTasks, error: childCheckError } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('parent_task_id', taskId);

      if (childCheckError) {
        console.error("Error checking for child tasks:", childCheckError);
        toast.error("Failed to check task dependencies");
        return false;
      }

      // If there are child tasks, handle them based on the deleteWithChildren flag
      if (childTasks && childTasks.length > 0) {
        if (deleteWithChildren) {
          // Delete child tasks first
          console.log(`Deleting ${childTasks.length} child tasks first...`);
          
          const { error: childDeleteError } = await supabase
            .from('tasks')
            .delete()
            .eq('parent_task_id', taskId);

          if (childDeleteError) {
            console.error("Error deleting child tasks:", childDeleteError);
            toast.error("Failed to delete recurring instances");
            return false;
          }
          
          console.log(`Successfully deleted ${childTasks.length} child tasks`);
        } else {
          const childTaskTitles = childTasks.map(task => task.title).join(', ');
          
          // Show warning and ask what to do
          toast.error(
            `Cannot delete task: ${childTasks.length} recurring instances depend on this task (${childTaskTitles}). Delete those tasks first.`,
            { duration: 6000 }
          );
          
          console.log(`Task has ${childTasks.length} child tasks:`, childTasks);
          return false;
        }
      }
      
      // If no child tasks, proceed with deletion
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error("Error deleting task:", error);
        
        // Provide more specific error messages based on the error
        if (error.code === '23503') {
          toast.error("Cannot delete task: Other records depend on this task");
        } else if (error.message.includes('violates foreign key constraint')) {
          toast.error("Cannot delete task: This task has dependent recurring instances");
        } else {
          toast.error("Failed to delete task: " + error.message);
        }
        return false;
      }

      console.log("Task deleted successfully");
      toast.success("Task deleted successfully");
      
      // Invalidate tasks query to refresh data
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      return true;
    } catch (error: any) {
      console.error("Error in deleteTask:", error);
      
      // Handle specific error cases
      if (error.message?.includes('409') || error.status === 409) {
        toast.error("Cannot delete task: This task has active recurring instances. Delete those first.");
      } else {
        toast.error("An unexpected error occurred: " + (error.message || 'Unknown error'));
      }
      return false;
    } finally {
      setIsDeleting(false);    }
  };

  const deleteTaskWithChildren = async (taskId: string) => {
    return await deleteTask(taskId, true);
  };

  return { deleteTask, deleteTaskWithChildren, isDeleting };
};
