
import { Task } from "@/types/task";
import { toast } from "@/hooks/use-toast";

/**
 * Hook for task viewing operations
 */
export const useTaskView = () => {
  const handleViewTask = (task: Task) => {
    console.log("View task:", task);
    toast({
      title: "Task Selected",
      description: `Viewing task: ${task.title}`
    });
  };

  return { handleViewTask };
};
