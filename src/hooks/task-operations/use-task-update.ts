
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";
import { toast } from "@/hooks/use-toast";
import { useTaskDocumentUpload } from "@/hooks/use-task-document-upload";
import { addDays, addWeeks, addMonths, addYears, parseISO, format } from "date-fns";
import { formatDateForInput, parseInputDate } from "@/utils/dateUtils";

interface TaskUpdatePayload {
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
  status?: 'not-started' | 'in-progress' | 'completed' | 'overdue';
  comments?: string | null;
}

interface RecurringTaskPayload {
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
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue';
  comments?: string | null;
  recurring_parent_id: string;
  approval_status: 'pending' | 'approved' | 'rejected';
}

/**
 * Hook for task update operations with enhanced date handling
 */
export const useTaskUpdate = (setIsEditDialogOpen: (isOpen: boolean) => void) => {
  const queryClient = useQueryClient();
  const { processTaskDocuments } = useTaskDocumentUpload();

  // Helper function to create recurring tasks with proper date handling
  const updateRecurringTasks = async (baseTask: TaskUpdatePayload, taskId: string, startDate: string, endDate: string, frequency: string) => {
    console.log(`Updating recurring tasks with frequency: ${frequency}, from ${startDate} to ${endDate}`);
    
    try {
      // First, delete any existing recurring tasks for this task
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('recurring_parent_id', taskId);
        
      if (deleteError) {
        console.error('Error deleting existing recurring tasks:', deleteError);
      }
      
      // Parse dates with enhanced handling
      const startDateObj = parseInputDate(startDate);
      const endDateObj = parseInputDate(endDate);
      
      if (!startDateObj || !endDateObj) {
        console.error('Invalid start or end date for recurring tasks');
        throw new Error('Invalid date format for recurring tasks');
      }
      
      let currentDate = startDateObj;
      const tasksToCreate: RecurringTaskPayload[] = [];
      
      while (currentDate <= endDateObj) {
        // Skip the first occurrence if it's the same as the base task's due date
        const currentDateStr = formatDateForInput(currentDate);
        if (currentDateStr === baseTask.due_date) {
          currentDate = getNextDate(currentDate, frequency);
          continue;
        }
        
        // Create a new task for this date
        const recurringTask: RecurringTaskPayload = {
          ...baseTask,
          due_date: currentDateStr,
          title: `${baseTask.title} (${format(currentDate, 'MMM dd, yyyy')})`,
          recurring_parent_id: taskId,
          status: baseTask.status || 'not-started',
          approval_status: 'approved'
        };
        
        tasksToCreate.push(recurringTask);
        
        // Move to next occurrence
        currentDate = getNextDate(currentDate, frequency);
      }
      
      if (tasksToCreate.length > 0) {
        console.log(`Creating ${tasksToCreate.length} recurring tasks`);
        const { data, error } = await supabase
          .from('tasks')
          .insert(tasksToCreate);
          
        if (error) {
          console.error('Error creating recurring tasks:', error);
          throw error;
        }
        
        toast({
          title: "Recurring Tasks Updated",
          description: `Created ${tasksToCreate.length} recurring tasks successfully.`
        });
      } else {
        console.log('No recurring tasks to create');
      }
    } catch (error) {
      console.error('Error in updateRecurringTasks:', error);
      toast({
        title: "Error",
        description: "Failed to update recurring tasks.",
        variant: "destructive"
      });
    }
  };
  
  // Helper function to calculate the next date based on frequency
  const getNextDate = (currentDate: Date, frequency: string): Date => {
    switch (frequency) {
      case 'daily':
        return addDays(currentDate, 1);
      case 'weekly':
        return addDays(currentDate, 7);
      case 'bi-weekly':
        return addDays(currentDate, 14);
      case 'monthly':
        return addMonths(currentDate, 1);
      case 'quarterly':
        return addMonths(currentDate, 3);
      case 'annually':
        return addYears(currentDate, 1);
      default:
        return addDays(currentDate, 7); // default to weekly
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      console.log("Updating task with enhanced date handling:", updatedTask);
      
      // Format all dates consistently
      const formattedDueDate = formatDateForInput(updatedTask.dueDate);
      const formattedStartDate = updatedTask.startDate ? formatDateForInput(updatedTask.startDate) : null;
      const formattedEndDate = updatedTask.endDate ? formatDateForInput(updatedTask.endDate) : null;
      
      console.log("Formatted dates for database:", {
        original: { due: updatedTask.dueDate, start: updatedTask.startDate, end: updatedTask.endDate },
        formatted: { due: formattedDueDate, start: formattedStartDate, end: formattedEndDate }
      });
      
      // assignee is already properly converted at the form level
      const assigneeValue = updatedTask.assignee === "unassigned" ? null : updatedTask.assignee;
      
      // Create the update payload with proper typing and formatted dates
      const updatePayload: TaskUpdatePayload = {
        title: updatedTask.title,
        description: updatedTask.description || null,
        department: updatedTask.department,
        priority: updatedTask.priority,
        due_date: formattedDueDate || null,
        is_recurring: updatedTask.isRecurring || false,
        is_customer_related: updatedTask.isCustomerRelated || false,
        customer_name: updatedTask.customerName || null,
        recurring_frequency: updatedTask.isRecurring ? updatedTask.recurringFrequency || null : null,
        start_date: updatedTask.isRecurring ? formattedStartDate : null,
        end_date: updatedTask.isRecurring ? formattedEndDate : null,
        attachments_required: updatedTask.attachmentsRequired,
        assignee: assigneeValue,
        status: updatedTask.status,
        comments: updatedTask.comments || null
      };
      
      console.log("Final update payload with formatted dates:", updatePayload);

      // Update the task with the properly constructed payload
      const { data, error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', updatedTask.id)
        .select();

      if (error) {
        console.error("Update error:", error);
        throw error;
      }

      console.log("Task updated successfully:", data);
      
      // Process document uploads if any
      if (updatedTask.documents && updatedTask.documents.length > 0) {
        console.log("Processing document uploads for updated task");
        await processTaskDocuments(updatedTask.id, updatedTask.documents);
      } else {
        console.log("No documents to process for updated task");
      }

      // If this is a recurring task with start and end dates, update the future tasks
      if (updatedTask.isRecurring && formattedStartDate && formattedEndDate && updatedTask.recurringFrequency) {
        await updateRecurringTasks(
          updatePayload,
          updatedTask.id,
          formattedStartDate, 
          formattedEndDate, 
          updatedTask.recurringFrequency
        );
      }

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

  return { handleUpdateTask };
};
