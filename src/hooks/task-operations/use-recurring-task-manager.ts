
import { supabase } from "@/integrations/supabase/client";
import { addDays, addMonths, addYears, format } from "date-fns";
import { formatDateForInput, parseInputDate } from "@/utils/dateUtils";
import { toast } from "@/hooks/use-toast";

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

export const useRecurringTaskManager = () => {
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

  // Create future recurring tasks
  const createFutureRecurringTasks = async (
    baseTask: any,
    parentTaskId: string,
    startDate: string,
    endDate: string,
    frequency: string
  ) => {
    console.log(`Creating future recurring tasks with frequency: ${frequency}, from ${startDate} to ${endDate}`);
    
    try {
      // Parse dates with enhanced handling
      const startDateObj = parseInputDate(startDate);
      const endDateObj = parseInputDate(endDate);
      
      if (!startDateObj || !endDateObj) {
        console.error('Invalid start or end date for recurring tasks');
        throw new Error('Invalid date format for recurring tasks');
      }
      
      let currentDate = getNextDate(startDateObj, frequency); // Start from the next occurrence
      const tasksToCreate: RecurringTaskPayload[] = [];
      
      while (currentDate <= endDateObj) {
        const currentDateStr = formatDateForInput(currentDate);
        
        // Create a new task for this date with proper naming
        const recurringTask: RecurringTaskPayload = {
          ...baseTask,
          due_date: currentDateStr,
          title: `${baseTask.title} (${format(currentDate, 'MMM dd, yyyy')})`,
          recurring_parent_id: parentTaskId,
          status: 'not-started',
          approval_status: 'approved'
        };
        
        tasksToCreate.push(recurringTask);
        
        // Move to next occurrence
        currentDate = getNextDate(currentDate, frequency);
      }
      
      if (tasksToCreate.length > 0) {
        console.log(`Creating ${tasksToCreate.length} future recurring tasks`);
        const { data, error } = await supabase
          .from('tasks')
          .insert(tasksToCreate);
          
        if (error) {
          console.error('Error creating future recurring tasks:', error);
          throw error;
        }
        
        toast({
          title: "Recurring Tasks Created",
          description: `Created ${tasksToCreate.length} future tasks successfully.`
        });
      } else {
        console.log('No future recurring tasks to create');
      }
    } catch (error) {
      console.error('Error in createFutureRecurringTasks:', error);
      toast({
        title: "Error",
        description: "Failed to create future recurring tasks.",
        variant: "destructive"
      });
    }
  };

  // Delete future recurring tasks
  const deleteFutureRecurringTasks = async (parentTaskId: string) => {
    console.log('Deleting future recurring tasks for parent:', parentTaskId);
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('recurring_parent_id', parentTaskId);
        
      if (error) {
        console.error('Error deleting future recurring tasks:', error);
        throw error;
      }
      
      console.log('Successfully deleted future recurring tasks');
    } catch (error) {
      console.error('Error in deleteFutureRecurringTasks:', error);
      throw error;
    }
  };

  // Check if a task should create the next recurring instance
  const shouldCreateNextRecurringTask = async (taskId: string): Promise<boolean> => {
    try {
      // Get the task details
      const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error || !task) {
        console.error('Error fetching task for recurring check:', error);
        return false;
      }

      // Only create next task if this task is completed and it's a recurring task
      if (task.status === 'completed' && task.is_recurring) {
        // Check if there are any future tasks already created
        const { data: futureTasks, error: futureError } = await supabase
          .from('tasks')
          .select('id')
          .eq('recurring_parent_id', taskId)
          .eq('status', 'not-started')
          .limit(1);

        if (futureError) {
          console.error('Error checking future tasks:', futureError);
          return false;
        }

        // Only create if no future tasks exist
        return futureTasks.length === 0;
      }

      return false;
    } catch (error) {
      console.error('Error in shouldCreateNextRecurringTask:', error);
      return false;
    }
  };

  return {
    createFutureRecurringTasks,
    deleteFutureRecurringTasks,
    shouldCreateNextRecurringTask,
    getNextDate
  };
};
