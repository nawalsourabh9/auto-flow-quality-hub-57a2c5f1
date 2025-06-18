
import React, { useState } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { useTaskOperations } from "@/hooks/use-task-operations";
import { useTaskFilters } from "@/hooks/use-task-filters";
import TasksHeader from "@/components/tasks/TasksHeader";
import TaskFilters from "@/components/tasks/TaskFilters";
import TasksContent from "@/components/tasks/TasksContent";
import TaskDialogs from "@/components/tasks/TaskDialogs";
import { TaskAutomationDebugPanel } from "@/components/tasks/TaskAutomationDebugPanel";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";

const Tasks = () => {
  const { data: tasks = [], isLoading } = useTasks();
  const { employee, isAdmin } = useAuth();
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  console.log("Current user role:", employee?.role);
  console.log("Is admin?", isAdmin);

  // Simplified permissions for all users - everyone can do everything
  const currentUserPermissions = {
    canInitiate: true,
    canCheck: true,
    canApprove: true,
    allowedDocumentTypes: ['sop', 'dataFormat', 'reportFormat', 'rulesAndProcedures'],
    allowedDepartments: [employee?.department || '', 'All']
  };

  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    departmentFilter,
    setDepartmentFilter,
    assigneeFilter,
    setAssigneeFilter,
    dueDateFilter,
    setDueDateFilter,
    frequencyFilter,
    setFrequencyFilter,
    filteredTasks,
    departments,
    teamMembers
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
    handleEditTask,
    handleStatusUpdate,
    handleUpdateTask,
    handleCreateTask,
    deleteTask
  } = useTaskOperations();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <TasksHeader onCreateTask={() => setIsCreateDialogOpen(true)} />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowDebugPanel(!showDebugPanel)}
          className="flex items-center gap-2"
        >
          <Bug className="w-4 h-4" />
          {showDebugPanel ? 'Hide' : 'Show'} Debug
        </Button>
      </div>

      {showDebugPanel && (
        <div className="mb-6">
          <TaskAutomationDebugPanel />
        </div>
      )}

      <TaskFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        departmentFilter={departmentFilter}
        setDepartmentFilter={setDepartmentFilter}
        assigneeFilter={assigneeFilter}
        setAssigneeFilter={setAssigneeFilter}
        dueDateFilter={dueDateFilter}
        setDueDateFilter={setDueDateFilter}
        frequencyFilter={frequencyFilter}
        setFrequencyFilter={setFrequencyFilter}
        departments={departments}
        teamMembers={teamMembers}
      />

      <TasksContent 
        filteredTasks={filteredTasks}
        onViewTask={handleStatusUpdate}
        onEditTask={handleEditTask}
        onDeleteTask={deleteTask}
        isAdmin={true} // Give admin capabilities to everyone
        currentUserId={employee?.id}
        currentUserPermissions={currentUserPermissions}
        teamMembers={teamMembers}
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
