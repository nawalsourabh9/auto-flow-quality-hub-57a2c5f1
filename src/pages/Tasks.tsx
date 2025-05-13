
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentEditTask, setCurrentEditTask] = useState<Task | null>(null);
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

  const handleEditTask = (task: Task) => {
    setCurrentEditTask(task);
    setIsEditDialogOpen(true);
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

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      console.log("Updating task:", updatedTask);
      
      // Update the task
      const { error } = await supabase
        .from('tasks')
        .update({
          title: updatedTask.title,
          description: updatedTask.description,
          department: updatedTask.department,
          priority: updatedTask.priority,
          due_date: updatedTask.dueDate,
          is_recurring: updatedTask.isRecurring || false,
          is_customer_related: updatedTask.isCustomerRelated || false,
          customer_name: updatedTask.customerName,
          recurring_frequency: updatedTask.recurringFrequency,
          attachments_required: updatedTask.attachmentsRequired,
          assignee: updatedTask.assignee || null
        })
        .eq('id', updatedTask.id);

      if (error) throw error;

      // Invalidate the tasks query to refetch data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      toast({
        title: "Task Updated",
        description: `Task "${updatedTask.title}" has been updated successfully.`
      });

      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: `Failed to update task: ${error.message || 'Unknown error'}`,
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
          assignee: newTask.assignee || null, // Important: Set to null or assigned value
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
      
      // If documents were uploaded, store them
      if (newTask.documents && newTask.documents.length > 0) {
        await processTaskDocuments(data.id, newTask.documents);
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
  
  // Helper function to process and store documents
  const processTaskDocuments = async (taskId: string, documents: any[]) => {
    try {
      // For each document, create an entry in the documents table
      for (const document of documents) {
        if (!document.file) continue;
        
        // Store the file in Supabase Storage
        const fileName = `${Date.now()}-${document.fileName}`;
        const { data: fileData, error: fileError } = await supabase.storage
          .from('task-documents')
          .upload(`tasks/${taskId}/${fileName}`, document.file);
          
        if (fileError) {
          console.error('Error uploading file:', fileError);
          continue;
        }
        
        // Create document record in the database
        const { error: docError } = await supabase
          .from('documents')
          .insert({
            task_id: taskId,
            file_name: document.fileName,
            file_type: document.fileType,
            document_type: document.documentType,
            version: document.version || '1.0',
            uploaded_by: (await supabase.auth.getUser()).data.user?.id || '00000000-0000-0000-0000-000000000000',
            notes: document.notes
          });
          
        if (docError) {
          console.error('Error creating document record:', docError);
        }
      }
    } catch (error) {
      console.error('Error processing documents:', error);
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
            <TasksTable 
              tasks={filteredTasks} 
              onViewTask={handleViewTask} 
              onEditTask={handleEditTask}
            />
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
        <TasksTable 
          tasks={filteredTasks} 
          onViewTask={handleViewTask}
          onEditTask={handleEditTask}
        />
      )}

      {/* Create Task Dialog */}
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
            <TaskForm onSubmit={handleUpdateTask} initialData={currentEditTask} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;
