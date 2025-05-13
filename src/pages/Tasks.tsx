
import React, { useState } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { useTaskOperations } from "@/hooks/use-task-operations";
import { useTaskFilters } from "@/hooks/use-task-filters";
import TasksHeader from "@/components/tasks/TasksHeader";
import TaskFilters from "@/components/tasks/TaskFilters";
import PendingTasksAlert from "@/components/tasks/PendingTasksAlert";
import TasksContent from "@/components/tasks/TasksContent";
import TaskDialogs from "@/components/tasks/TaskDialogs";

const Tasks = () => {
  const { data: tasks = [], isLoading } = useTasks();
  const [activeTab, setActiveTab] = useState("all-tasks");
  
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    filteredTasks,
    pendingTasks,
    filteredPendingTasks
  } = useTaskFilters(tasks);

  const {
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
  } = useTaskOperations();

  // Remove all role and permission checks - all users can see and create tasks
  const isDepartmentHead = () => true;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TasksHeader onCreateTask={() => setIsCreateDialogOpen(true)} />

      {isDepartmentHead() && (
        <PendingTasksAlert 
          pendingTasks={pendingTasks}
          activeTab={activeTab}
          onViewPendingTasks={() => setActiveTab("pending-approval")}
        />
      )}

      <TaskFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
      />

      <TasksContent 
        isDepartmentHead={isDepartmentHead}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingTasks={pendingTasks}
        filteredTasks={filteredTasks}
        filteredPendingTasks={filteredPendingTasks}
        onViewTask={handleViewTask}
        onEditTask={handleEditTask}
        onApproveTask={handleApproveTask}
        onRejectTask={handleRejectTask}
      />

      <TaskDialogs 
        isCreateDialogOpen={isCreateDialogOpen}
        setIsCreateDialogOpen={setIsCreateDialogOpen}
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        currentEditTask={currentEditTask}
        onCreateTask={handleCreateTask}
        onUpdateTask={handleUpdateTask}
      />
    </div>
  );
};

export default Tasks;
