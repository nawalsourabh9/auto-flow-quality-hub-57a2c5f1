
import { useState } from "react";
import { Task } from "@/types/task";

/**
 * Hook for managing task operation state
 */
export const useTaskState = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentEditTask, setCurrentEditTask] = useState<Task | null>(null);

  return {
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    currentEditTask,
    setCurrentEditTask
  };
};
