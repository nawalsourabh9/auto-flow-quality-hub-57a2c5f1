
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";

export const useTasks = () => {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      console.log("Fetching tasks from database...");
      
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (tasksError) {
        console.error("Error fetching tasks:", tasksError);
        throw tasksError;
      }

      console.log(`Retrieved ${tasksData.length} tasks`);
      console.log("Task assignee data:", tasksData.map(task => ({ id: task.id, assignee: task.assignee })));

      // Get unique employee IDs from tasks, filtering out null or empty values
      const employeeIds = tasksData
        .map(task => task.assignee)
        .filter(id => id && typeof id === 'string');
      
      console.log(`Found ${employeeIds.length} unique assignees:`, employeeIds);
      
      // Fetch employee details if there are assignees
      let employeesData = [];
      if (employeeIds.length > 0) {
        const { data: empData, error: empError } = await supabase
          .from("employees")
          .select("*")  // Fetch all fields to ensure we have complete data
          .in("id", employeeIds);
          
        if (empError) {
          console.error("Error fetching employees:", empError);
        } else {
          employeesData = empData || [];
          console.log(`Retrieved ${employeesData.length} employee records:`, employeesData.map(emp => ({ id: emp.id, name: emp.name })));
        }
      }

      // Map the database fields to our Task interface
      const tasks: Task[] = tasksData.map(item => {
        // Find employee details
        const employee = employeesData.find(emp => emp.id === item.assignee);
        console.log(`For task ${item.id}, assignee ${item.assignee}, found employee:`, employee || "Not found");
        
        // Generate assignee details
        let assigneeDetails = undefined;
        if (employee) {
          // Create initials from name (e.g., "John Doe" -> "JD")
          const initials = employee.name
            .split(' ')
            .map(name => name[0])
            .join('')
            .toUpperCase();
            
          assigneeDetails = {
            name: employee.name,
            initials: initials,
            department: employee.department,
            position: employee.position
          };
        } else if (item.assignee === null) {
          // Handle unassigned tasks
          assigneeDetails = {
            name: "Unassigned",
            initials: "UN",
            department: item.department,
            position: ""
          };
        }

        return {
          id: item.id,
          title: item.title,
          description: item.description || "",
          department: item.department,
          assignee: item.assignee || "unassigned", // Use "unassigned" for null values
          priority: item.priority as 'low' | 'medium' | 'high',
          dueDate: item.due_date || "",
          status: item.status as 'completed' | 'in-progress' | 'overdue' | 'not-started',
          createdAt: item.created_at || "",
          isRecurring: item.is_recurring || false,
          isCustomerRelated: item.is_customer_related || false,
          customerName: item.customer_name || "",
          recurringFrequency: item.recurring_frequency || "",
          attachmentsRequired: item.attachments_required as 'none' | 'optional' | 'required',
          assigneeDetails,
          approvalStatus: item.approval_status as 'pending' | 'approved' | 'rejected' | undefined,
          approvedBy: item.approved_by,
          approvedAt: item.approved_at,
          rejectedBy: item.rejected_by,
          rejectedAt: item.rejected_at,
          rejectionReason: item.rejection_reason,
          departmentHeadId: item.department_head_id,
          comments: item.comments
        };
      });

      console.log("Tasks processed successfully");
      return tasks;
    }
  });
};
