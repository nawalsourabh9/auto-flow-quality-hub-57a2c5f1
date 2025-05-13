
import { Task } from "@/types/task";

/**
 * Hook for task editing operations
 */
export const useTaskEdit = (setCurrentEditTask: (task: Task | null) => void, setIsEditDialogOpen: (isOpen: boolean) => void) => {
  const handleEditTask = (task: Task) => {
    setCurrentEditTask(task);
    setIsEditDialogOpen(true);
  };

  return { handleEditTask };
};
