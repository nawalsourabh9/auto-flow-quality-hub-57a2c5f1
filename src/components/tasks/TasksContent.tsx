
import React from "react";
import { Task } from "@/types/task";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import TasksTable from "@/components/tasks/TaskTable";
import TaskApprovalSection from "@/components/tasks/TaskApprovalSection";

interface TasksContentProps {
  isDepartmentHead: () => boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingTasks: Task[];
  filteredTasks: Task[];
  filteredPendingTasks: Task[];
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onApproveTask: (task: Task) => void;
  onRejectTask: (task: Task) => void;
}

const TasksContent = ({
  isDepartmentHead,
  activeTab,
  setActiveTab,
  pendingTasks,
  filteredTasks,
  filteredPendingTasks,
  onViewTask,
  onEditTask,
  onApproveTask,
  onRejectTask
}: TasksContentProps) => {
  if (isDepartmentHead()) {
    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all-tasks">All Tasks</TabsTrigger>
          <TabsTrigger value="pending-approval" className="relative">
            Pending Approval
            {pendingTasks.length > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 bg-amber-200 text-amber-800 hover:bg-amber-200"
              >
                {pendingTasks.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all-tasks" className="pt-4">
          <TasksTable 
            tasks={filteredTasks} 
            onViewTask={onViewTask} 
            onEditTask={onEditTask}
          />
        </TabsContent>
        
        <TabsContent value="pending-approval" className="pt-4">
          <TaskApprovalSection 
            tasks={filteredPendingTasks}
            onApproveTask={onApproveTask}
            onRejectTask={onRejectTask}
          />
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <TasksTable 
      tasks={filteredTasks} 
      onViewTask={onViewTask}
      onEditTask={onEditTask}
    />
  );
};

export default TasksContent;
