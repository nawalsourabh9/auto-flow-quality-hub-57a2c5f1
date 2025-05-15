
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
      console.log("Creating task:", newTask);
      
      // Create the payload object for inserting into database
      const taskPayload = {
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
      
      // Handle the assignee field separately to deal with "unassigned"
      if (newTask.assignee && newTask.assignee !== "unassigned") {
        // @ts-ignore - Need to add to the payload object
        taskPayload.assignee = newTask.assignee;
      } else {
        // @ts-ignore - If "unassigned" or empty, set to null explicitly
        taskPayload.assignee = null;
      }
      
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
