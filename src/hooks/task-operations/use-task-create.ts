
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";
import { toast } from "@/hooks/use-toast";
import { useTaskDocumentUpload } from "@/hooks/use-task-document-upload";

/**
 * Hook for task creation operations
 */
export const useTaskCreate = (setIsCreateDialogOpen: (isOpen: boolean) => void) => {
  const queryClient = useQueryClient();
  const { processTaskDocuments } = useTaskDocumentUpload();

  const handleCreateTask = async (newTask: Task) => {
    try {
      console.log("Creating task with data:", newTask);
      
      // Create the payload object for inserting into database
      const taskPayload: Record<string, any> = {
        title: newTask.title,
        description: newTask.description,
        department: newTask.department,
        priority: newTask.priority,
        due_date: newTask.dueDate,
        is_recurring: newTask.isRecurring || false,
        is_customer_related: newTask.isCustomerRelated || false,
        customer_name: newTask.customerName,
        recurring_frequency: newTask.recurringFrequency,
        attachments_required: newTask.attachmentsRequired,
        approval_status: 'approved', // All tasks are automatically approved
        status: 'not-started'
      };
      
      // Handle the assignee field
      // CRITICAL: Set to null explicitly if "unassigned" to avoid foreign key constraint error
      if (newTask.assignee === "unassigned") {
        taskPayload.assignee = null;
      } else {
        console.log("Setting assignee ID:", newTask.assignee);
        taskPayload.assignee = newTask.assignee;
      }
      
      console.log("Final task payload:", taskPayload);
      
      // Create the task with the properly constructed payload
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskPayload)
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

  return { handleCreateTask };
};
