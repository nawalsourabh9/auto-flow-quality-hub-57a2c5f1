
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Task } from "@/types/task";
import TasksTable from "@/components/tasks/TaskTable";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import TaskForm from "@/components/tasks/TaskForm";
import { useTasks } from "@/hooks/use-tasks";
import { supabase } from "@/integrations/supabase/client";
import TaskFilters from "@/components/tasks/TaskFilters";
import PendingTasksAlert from "@/components/tasks/PendingTasksAlert";
import TaskApprovalSection from "@/components/tasks/TaskApprovalSection";
import { useQueryClient } from "@tanstack/react-query";

const Tasks = () => {
  const queryClient = useQueryClient();
  const { data: tasks = [], isLoading } = useTasks();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all-tasks");

  // Remove all role and permission checks - all users can see and create tasks
  const isDepartmentHead = () => true;

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const pendingTasks = tasks.filter(task => task.approvalStatus === 'pending');

  const filteredPendingTasks = pendingTasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    
    return matchesSearch && matchesPriority;
  });

  const handleViewTask = (task: Task) => {
    console.log("View task:", task);
    toast({
      title: "Task Selected",
      description: `Viewing task: ${task.title}`
    });
  };

  const handleApproveTask = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          approval_status: 'approved',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;

      // Invalidate the tasks query to refetch data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      toast({
        title: "Task Approved",
        description: `Task "${task.title}" has been approved`
      });
    } catch (error) {
      console.error('Error approving task:', error);
      toast({
        title: "Error",
        description: "Failed to approve task",
        variant: "destructive"
      });
    }
  };

  const handleRejectTask = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          approval_status: 'rejected',
          rejected_by: (await supabase.auth.getUser()).data.user?.id,
          rejected_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;

      // Invalidate the tasks query to refetch data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      toast({
        title: "Task Rejected",
        description: `Task "${task.title}" has been rejected`
      });
    } catch (error) {
      console.error('Error rejecting task:', error);
      toast({
        title: "Error",
        description: "Failed to reject task",
        variant: "destructive"
      });
    }
  };

  const handleCreateTask = async (newTask: Task) => {
    try {
      console.log("Creating task:", newTask);
      
      // Set assignee to null - this is important to fix the foreign key constraint error
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: newTask.title,
          description: newTask.description,
          department: newTask.department,
          assignee: null, // Important: Set to null to avoid foreign key constraint error
          priority: newTask.priority,
          due_date: newTask.dueDate,
          is_recurring: newTask.isRecurring || false,
          is_customer_related: newTask.isCustomerRelated || false,
          customer_name: newTask.customerName,
          recurring_frequency: newTask.recurringFrequency,
          attachments_required: newTask.attachmentsRequired,
          approval_status: 'approved', // All tasks are automatically approved
          status: 'not-started'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        throw error;
      }

      // Invalidate the tasks query to refetch data after successful creation
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      toast({
        title: "Task Created",
        description: `Task "${data.title}" has been created successfully.`
      });

      setIsCreateDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: `Failed to create task: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

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
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage and track all your quality tasks</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> New Task
        </Button>
      </div>

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

      {isDepartmentHead() ? (
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
            <TasksTable tasks={filteredTasks} onViewTask={handleViewTask} />
          </TabsContent>
          
          <TabsContent value="pending-approval" className="pt-4">
            <TaskApprovalSection 
              tasks={filteredPendingTasks}
              onApproveTask={handleApproveTask}
              onRejectTask={handleRejectTask}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <TasksTable tasks={filteredTasks} onViewTask={handleViewTask} />
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new task
            </DialogDescription>
          </DialogHeader>
          <TaskForm onSubmit={handleCreateTask} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;
