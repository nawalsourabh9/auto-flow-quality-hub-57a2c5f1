
import React from "react";
import { Task } from "@/types/task";
import TasksTable from "@/components/tasks/TaskTable";

interface TasksContentProps {
  filteredTasks: Task[];
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask?: (taskId: string) => Promise<boolean>;
  isAdmin?: boolean;
}

const TasksContent = ({
  filteredTasks,
  onViewTask,
  onEditTask,
  onDeleteTask,
  isAdmin
}: TasksContentProps) => {
  return (
    <TasksTable 
      tasks={filteredTasks} 
      onViewTask={onViewTask}
      onEditTask={onEditTask}
      onDeleteTask={onDeleteTask}
      isAdmin={isAdmin}
    />
  );
};

export default TasksContent;
