
import React from "react";
import { Task } from "@/types/task";
import TaskForm from "./TaskForm";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import StatusUpdateDialog from "./StatusUpdateDialog";

interface TaskDialogsProps {
  isCreateDialogOpen: boolean;
  setIsCreateDialogOpen: (isOpen: boolean) => void;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (isOpen: boolean) => void;
  isStatusUpdateDialogOpen: boolean;
  setIsStatusUpdateDialogOpen: (isOpen: boolean) => void;
  currentEditTask: Task | null;
  currentStatusTask: Task | null;
  onCreateTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
}

const TaskDialogs: React.FC<TaskDialogsProps> = ({
  isCreateDialogOpen,
  setIsCreateDialogOpen,
  isEditDialogOpen,
  setIsEditDialogOpen,
  isStatusUpdateDialogOpen,
  setIsStatusUpdateDialogOpen,
  currentEditTask,
  currentStatusTask,
  onCreateTask,
  onUpdateTask
}) => {
  return (
    <>
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <TaskForm onSubmit={onCreateTask} />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <TaskForm onSubmit={onUpdateTask} initialData={currentEditTask || {}} />
        </DialogContent>
      </Dialog>

      <StatusUpdateDialog
        task={currentStatusTask}
        isOpen={isStatusUpdateDialogOpen}
        onClose={() => setIsStatusUpdateDialogOpen(false)}
        onUpdateTask={onUpdateTask}
      />
    </>
  );
};

export default TaskDialogs;
