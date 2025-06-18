
import { useTaskState } from "./task-operations/use-task-state";
import { useTaskView } from "./task-operations/use-task-view";
import { useTaskEdit } from "./task-operations/use-task-edit";
import { useTaskApproval } from "./task-operations/use-task-approval";
import { useTaskUpdate } from "./task-operations/use-task-update";
import { useTaskCreate } from "./task-operations/use-task-create";
import { useTaskDelete } from "./task-operations/use-task-delete";
import { Task } from "@/types/task";

/**
 * Main hook for task operations that combines smaller specialized hooks
 */
export const useTaskOperations = () => {
  const {
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
  } = useTaskState();

  const { handleViewTask } = useTaskView();
  const { handleEditTask } = useTaskEdit(setCurrentEditTask, setIsEditDialogOpen);
  const { handleApproveTask, handleRejectTask } = useTaskApproval();
  const { handleUpdateTask } = useTaskUpdate(setIsEditDialogOpen);
  const { handleCreateTask } = useTaskCreate(setIsCreateDialogOpen);
  const { deleteTask, deleteTaskWithChildren } = useTaskDelete();

  const handleStatusUpdate = (task: Task) => {
    setCurrentStatusTask(task);
    setIsStatusUpdateDialogOpen(true);
  };

  return {
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isStatusUpdateDialogOpen,
    setIsStatusUpdateDialogOpen,
    currentEditTask,
    currentStatusTask,
    handleViewTask,
    handleEditTask,
    handleStatusUpdate,
    handleApproveTask,
    handleRejectTask,
    handleUpdateTask,
    handleCreateTask,
    deleteTask,
    deleteTaskWithChildren
  };
};
