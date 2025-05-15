
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";
import { toast } from "@/hooks/use-toast";
import { useTaskDocumentUpload } from "@/hooks/use-task-document-upload";

interface TaskPayload {
  title: string;
  description: string;
  department: string;
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  is_recurring: boolean;
  is_customer_related: boolean;
  customer_name?: string | null;
  recurring_frequency?: string | null;
  attachments_required: 'none' | 'optional' | 'required';
  approval_status: 'pending' | 'approved' | 'rejected';
  status: 'completed' | 'in-progress' | 'overdue' | 'not-started';
  assignee: string | null;
}

/**
 * Hook for task creation operations
 */
export const useTaskCreate = (setIsCreateDialogOpen: (isOpen: boolean) => void) => {
  const queryClient = useQueryClient();
  const { processTaskDocuments } = useTaskDocumentUpload();

  const handleCreateTask = async (newTask: Task) => {
    try {
      console.log("Creating task with data:", newTask);
      console.log("Assignee value received from form:", newTask.assignee);
      
      // Handle the assignee value properly
      let assigneeValue: string | null = null;
      
      if (newTask.assignee && newTask.assignee !== "unassigned") {
        assigneeValue = newTask.assignee;
        console.log("Setting assignee value to:", assigneeValue);
      } else {
        console.log("Setting assignee to null (unassigned)");
      }
      
      // Create the properly typed payload for database insertion
      const taskPayload: TaskPayload = {
        title: newTask.title,
        description: newTask.description || "",
        department: newTask.department,
        priority: newTask.priority,
        due_date: newTask.dueDate,
        is_recurring: newTask.isRecurring || false,
        is_customer_related: newTask.isCustomerRelated || false,
        customer_name: newTask.customerName || null,
        recurring_frequency: newTask.recurringFrequency || null,
        attachments_required: newTask.attachmentsRequired,
        approval_status: 'approved', // All tasks are automatically approved
        status: 'not-started',
        assignee: assigneeValue  // Use the properly processed assignee value
      };
      
      console.log("Final task payload before database insertion:", taskPayload);
      console.log("Assignee type:", typeof taskPayload.assignee);
      
      // Log the actual query that will be executed
      console.log("Executing insert query with assignee:", taskPayload.assignee);
      
      // Create the task with the properly typed payload
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskPayload)
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        throw error;
      }
      
      console.log("Task created successfully, returned data:", data);
      
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
