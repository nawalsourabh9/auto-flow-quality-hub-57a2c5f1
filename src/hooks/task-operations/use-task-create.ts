
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";
import { toast } from "@/hooks/use-toast";
import { useTaskDocumentUpload } from "@/hooks/use-task-document-upload";
import { formatDateForInput } from "@/utils/dateUtils";

interface TaskPayload {
  title: string;
  description: string | null;
  department: string;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  is_recurring: boolean;
  is_customer_related: boolean;
  customer_name?: string | null;
  recurring_frequency?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  attachments_required: 'none' | 'optional' | 'required';
  assignee: string | null;
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue' | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  original_task_name?: string | null;
  recurrence_count_in_period?: number;
  is_template?: boolean; // New field
  is_generated?: boolean; // New field
}

export const useTaskCreate = (setIsCreateDialogOpen: (isOpen: boolean) => void) => {
  const queryClient = useQueryClient();
  const { processTaskDocuments } = useTaskDocumentUpload();

  const handleCreateTask = async (newTask: Partial<Task> & { documentUploads?: any[] }) => {
    try {
      console.log("Creating task with enhanced recurring support:", newTask);
      
      // Format dates consistently
      const formattedDueDate = formatDateForInput(newTask.dueDate);
      const formattedStartDate = newTask.startDate ? formatDateForInput(newTask.startDate) : null;
      const formattedEndDate = newTask.endDate ? formatDateForInput(newTask.endDate) : null;
      
      // Handle assignee conversion
      const assigneeValue = newTask.assignee === "unassigned" ? null : newTask.assignee;
        // Create the task payload with new fields
      const taskPayload: TaskPayload = {
        title: newTask.title || "",
        description: newTask.description || null,
        department: newTask.department || "Quality",
        priority: newTask.priority || "medium",
        due_date: newTask.isRecurring ? null : formattedDueDate || null, // Templates have no due_date
        is_recurring: newTask.isRecurring || false,
        is_customer_related: newTask.isCustomerRelated || false,
        customer_name: newTask.customerName || null,
        recurring_frequency: newTask.isRecurring ? newTask.recurringFrequency || null : null,
        start_date: newTask.isRecurring ? formattedStartDate : null,
        end_date: newTask.isRecurring ? formattedEndDate : null,
        attachments_required: newTask.attachmentsRequired || "none",
        assignee: assigneeValue,
        status: newTask.isRecurring ? null : "not-started", // Templates have no status
        approval_status: "approved",
        // Set original_task_name for recurring tasks - this will be used for naming instances
        original_task_name: newTask.isRecurring ? newTask.title || null : null,
        recurrence_count_in_period: newTask.isRecurring ? 1 : undefined, // First instance starts at 1
        is_template: newTask.isRecurring || false, // Recurring tasks are templates
        is_generated: false // User-created tasks are not auto-generated
      };
      
      console.log("Task payload with new recurring fields:", taskPayload);

      const { data, error } = await supabase
        .from('tasks')
        .insert(taskPayload)
        .select()
        .single();

      if (error) {
        console.error("Task creation error:", error);
        throw error;
      }      console.log("Task created successfully:", data);
      
      // If this is a recurring task (template), create the first instance if needed
      if (newTask.isRecurring && formattedStartDate) {
        const startDate = new Date(formattedStartDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Create first instance if start date is today or in the past
        if (startDate <= today) {
          try {
            console.log("Creating first instance for template:", data.id);
            const { data: instanceData, error: instanceError } = await supabase
              .rpc('create_first_recurring_instance', { template_id: data.id });
            
            if (instanceError) {
              console.error("Error creating first instance:", instanceError);
              // Don't fail the whole operation, just log the error
            } else {
              console.log("First instance created:", instanceData);
            }
          } catch (instanceError) {
            console.error("Exception creating first instance:", instanceError);
            // Don't fail the whole operation
          }
        }
      }
      
      // Process document uploads if any
      if (newTask.documentUploads && newTask.documentUploads.length > 0) {
        console.log("Processing document uploads for new task");
        await processTaskDocuments(data.id, newTask.documentUploads);
      }

      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      toast({
        title: "Task Created",
        description: `Task "${newTask.title}" has been created successfully.${newTask.isRecurring ? ' Recurring instances will be generated automatically when completed.' : ''}`
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
