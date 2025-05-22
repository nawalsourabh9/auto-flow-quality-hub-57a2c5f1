
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";
import { toast } from "@/hooks/use-toast";
import { useTaskDocumentUpload } from "@/hooks/use-task-document-upload";
import { addDays, addWeeks, addMonths, addYears, parseISO, format } from "date-fns";

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
  start_date?: string | null;
  end_date?: string | null;
  attachments_required: 'none' | 'optional' | 'required';
  approval_status: 'pending' | 'approved' | 'rejected';
  status: 'completed' | 'in-progress' | 'overdue' | 'not-started';
  assignee: string | null;
}

// Fixed interface for recurring tasks to match database schema
interface RecurringTaskPayload {
  title: string;
  description: string;
  department: string;
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  is_recurring: boolean;
  is_customer_related: boolean;
  customer_name?: string | null;
  recurring_frequency?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  attachments_required: 'none' | 'optional' | 'required';
  approval_status: 'pending' | 'approved' | 'rejected';
  status: 'completed' | 'in-progress' | 'overdue' | 'not-started';
  assignee: string | null;
  recurring_parent_id: string;
}

/**
 * Hook for task creation operations
 */
export const useTaskCreate = (setIsCreateDialogOpen: (isOpen: boolean) => void) => {
  const queryClient = useQueryClient();
  const { processTaskDocuments } = useTaskDocumentUpload();

  // Helper function to create recurring tasks
  const createRecurringTasks = async (baseTask: TaskPayload, parentTaskId: string, startDate: string, endDate: string, frequency: string) => {
    console.log(`Creating recurring tasks with frequency: ${frequency}, from ${startDate} to ${endDate}`);
    
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      let currentDate = start;
      const tasksToCreate: RecurringTaskPayload[] = [];
      
      while (currentDate <= end) {
        // Skip the first occurrence if it's the same as the base task's due date
        if (format(currentDate, 'yyyy-MM-dd') === baseTask.due_date) {
          // Move to next occurrence
          currentDate = getNextDate(currentDate, frequency);
          continue;
        }
        
        // Create a new task for this date
        const recurringTask: RecurringTaskPayload = {
          ...baseTask,
          due_date: format(currentDate, 'yyyy-MM-dd'),
          title: `${baseTask.title} (${format(currentDate, 'MMM dd, yyyy')})`,
          recurring_parent_id: parentTaskId
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
          title: "Recurring Tasks Created",
          description: `Created ${tasksToCreate.length} recurring tasks successfully.`
        });
      } else {
        console.log('No recurring tasks to create');
      }
    } catch (error) {
      console.error('Error in createRecurringTasks:', error);
      toast({
        title: "Error",
        description: "Failed to create recurring tasks.",
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

  const handleCreateTask = async (newTask: Task) => {
    try {
      console.log("Creating task with data:", newTask);
      console.log("Assignee type:", typeof newTask.assignee);
      console.log("Assignee value received from form:", newTask.assignee);
      console.log("Recurring task data:", {
        isRecurring: newTask.isRecurring,
        frequency: newTask.recurringFrequency,
        startDate: newTask.startDate,
        endDate: newTask.endDate
      });
      
      // assignee is already properly converted at the form level
      // but let's double check here
      const assigneeValue = newTask.assignee === "unassigned" ? null : newTask.assignee;
      console.log("Final assignee value for database:", assigneeValue);
      
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
        start_date: newTask.startDate || null,
        end_date: newTask.endDate || null,
        attachments_required: newTask.attachmentsRequired,
        approval_status: 'approved', // All tasks are automatically approved
        status: 'not-started',
        assignee: assigneeValue  // Use the properly processed assignee value
      };
      
      console.log("Final task payload before database insertion:", taskPayload);
      console.log("Assignee type in payload:", typeof taskPayload.assignee);
      
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

      // If this is a recurring task with start and end dates, create the future tasks
      if (newTask.isRecurring && newTask.startDate && newTask.endDate && newTask.recurringFrequency) {
        await createRecurringTasks(
          taskPayload, 
          data.id, // Pass the task ID to identify the parent
          newTask.startDate, 
          newTask.endDate, 
          newTask.recurringFrequency
        );
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
