
import React from "react";
import { Task } from "@/types/task";
import TasksTable from "@/components/tasks/TaskTable";

interface TasksContentProps {
  filteredTasks: Task[];
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask?: (taskId: string) => Promise<boolean>;
  isAdmin?: boolean;
  currentUserId?: string;
  currentUserPermissions?: any; // Simplified - accept any permissions object
  teamMembers?: Array<{
    id: string;
    name: string;
    position: string;
    initials: string;
  }>;
}

const TasksContent = ({
  filteredTasks,
  onViewTask,
  onEditTask,
  onDeleteTask,
  isAdmin,
  currentUserId,
  currentUserPermissions,
  teamMembers
}: TasksContentProps) => {
  console.log("TasksContent isAdmin:", isAdmin);
  
  return (
    <TasksTable 
      tasks={filteredTasks} 
      onViewTask={onViewTask}
      onEditTask={onEditTask}
      onDeleteTask={onDeleteTask}
      isAdmin={isAdmin}
      currentUserId={currentUserId}
      currentUserPermissions={currentUserPermissions}
      teamMembers={teamMembers}
    />
  );
};

export default TasksContent;
