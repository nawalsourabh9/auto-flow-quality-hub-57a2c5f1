
import { useTaskState } from "./task-operations/use-task-state";
import { useTaskView } from "./task-operations/use-task-view";
import { useTaskEdit } from "./task-operations/use-task-edit";
import { useTaskApproval } from "./task-operations/use-task-approval";
import { useTaskUpdate } from "./task-operations/use-task-update";
import { useTaskCreate } from "./task-operations/use-task-create";

/**
 * Main hook for task operations that combines smaller specialized hooks
 */
export const useTaskOperations = () => {
  const {
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    currentEditTask,
    setCurrentEditTask
  } = useTaskState();

  const { handleViewTask } = useTaskView();
  const { handleEditTask } = useTaskEdit(setCurrentEditTask, setIsEditDialogOpen);
  const { handleApproveTask, handleRejectTask } = useTaskApproval();
  const { handleUpdateTask } = useTaskUpdate(setIsEditDialogOpen);
  const { handleCreateTask } = useTaskCreate(setIsCreateDialogOpen);

  return {
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    currentEditTask,
    handleViewTask,
    handleEditTask,
    handleApproveTask,
    handleRejectTask,
    handleUpdateTask,
    handleCreateTask
  };
};
