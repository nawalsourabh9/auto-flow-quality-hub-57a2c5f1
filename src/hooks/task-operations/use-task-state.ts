
import { useState } from "react";
import { Task } from "@/types/task";

export const useTaskState = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatusUpdateDialogOpen, setIsStatusUpdateDialogOpen] = useState(false);
  const [currentEditTask, setCurrentEditTask] = useState<Task | null>(null);
  const [currentStatusTask, setCurrentStatusTask] = useState<Task | null>(null);

  return {
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isStatusUpdateDialogOpen,
    setIsStatusUpdateDialogOpen,
    currentEditTask,
    setCurrentEditTask,
    currentStatusTask,
    setCurrentStatusTask
  };
};
