
import React, { useState } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { useTaskOperations } from "@/hooks/use-task-operations";
import { useTaskFilters } from "@/hooks/use-task-filters";
import TasksHeader from "@/components/tasks/TasksHeader";
import TaskFilters from "@/components/tasks/TaskFilters";
import PendingTasksAlert from "@/components/tasks/PendingTasksAlert";
import TasksContent from "@/components/tasks/TasksContent";
import TaskDialogs from "@/components/tasks/TaskDialogs";
import { useAuth } from "@/hooks/use-auth";

const Tasks = () => {
  const { data: tasks = [], isLoading } = useTasks();
  const [activeTab, setActiveTab] = useState("all-tasks");
  const { employee } = useAuth();
  
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
    deleteTask
  } = useTaskOperations();

  // Check if user is an admin
  const isAdmin = employee?.role === 'admin';

  // Remove all role and permission checks for department head - all users can see and create tasks
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
        onViewTask={handleStatusUpdate}
        onEditTask={handleEditTask}
        onApproveTask={handleApproveTask}
        onRejectTask={handleRejectTask}
        onDeleteTask={deleteTask}
        isAdmin={isAdmin}
      />

      <TaskDialogs 
        isCreateDialogOpen={isCreateDialogOpen}
        setIsCreateDialogOpen={setIsCreateDialogOpen}
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        isStatusUpdateDialogOpen={isStatusUpdateDialogOpen}
        setIsStatusUpdateDialogOpen={setIsStatusUpdateDialogOpen}
        currentEditTask={currentEditTask}
        currentStatusTask={currentStatusTask}
        onCreateTask={handleCreateTask}
        onUpdateTask={handleUpdateTask}
      />
    </div>
  );
};

export default Tasks;
