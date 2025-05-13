
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import TaskForm from "@/components/tasks/TaskForm";
import { Task } from "@/types/task";

interface TaskDialogsProps {
  isCreateDialogOpen: boolean;
  setIsCreateDialogOpen: (open: boolean) => void;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  currentEditTask: Task | null;
  onCreateTask: (task: Task) => Promise<void>;
  onUpdateTask: (task: Task) => Promise<void>;
}

const TaskDialogs = ({
  isCreateDialogOpen,
  setIsCreateDialogOpen,
  isEditDialogOpen,
  setIsEditDialogOpen,
  currentEditTask,
  onCreateTask,
  onUpdateTask
}: TaskDialogsProps) => {
  return (
    <>
      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new task
            </DialogDescription>
          </DialogHeader>
          <TaskForm onSubmit={onCreateTask} />
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details below
            </DialogDescription>
          </DialogHeader>
          {currentEditTask && (
            <TaskForm onSubmit={onUpdateTask} initialData={currentEditTask} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskDialogs;
