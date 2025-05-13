
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";
import { toast } from "@/hooks/use-toast";
import { useTaskDocumentUpload } from "@/hooks/use-task-document-upload";

export const useTaskOperations = () => {
  const queryClient = useQueryClient();
  const { processTaskDocuments } = useTaskDocumentUpload();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentEditTask, setCurrentEditTask] = useState<Task | null>(null);

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
      
      // Update the task, ensuring we handle "unassigned" assignee properly
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
          // Fixed: Set assignee to null if it's "unassigned", to avoid FK constraints
          assignee: updatedTask.assignee === "unassigned" ? null : updatedTask.assignee
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
          assignee: newTask.assignee === "unassigned" ? null : newTask.assignee, // Important: Set to null or assigned value
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

  return {
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen, 
    setIsEditDialogOpen,
    currentEditTask,
    setCurrentEditTask,
    handleViewTask,
    handleEditTask,
    handleApproveTask,
    handleRejectTask,
    handleUpdateTask,
    handleCreateTask
  };
};
