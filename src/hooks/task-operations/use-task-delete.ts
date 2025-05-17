
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const useTaskDelete = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const deleteTask = async (taskId: string) => {
    if (!taskId) return;
    
    try {
      setIsDeleting(true);
      console.log(`Attempting to delete task with ID: ${taskId}`);
      
      // Delete task from database
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error("Error deleting task:", error);
        toast.error("Failed to delete task");
        return false;
      }

      console.log("Task deleted successfully");
      toast.success("Task deleted successfully");
      
      // Invalidate tasks query to refresh data
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      return true;
    } catch (error) {
      console.error("Error in deleteTask:", error);
      toast.error("An unexpected error occurred");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteTask, isDeleting };
};
