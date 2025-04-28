
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";

export const useTasks = () => {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      // Remove the problematic join query and fetch only tasks
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tasks:", error);
        throw error;
      }

      // Map the database fields to our Task interface
      const tasks: Task[] = data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description || "",
        department: item.department,
        assignee: item.assignee || "",
        priority: item.priority as 'low' | 'medium' | 'high',
        dueDate: item.due_date || "",
        status: item.status as 'completed' | 'in-progress' | 'overdue' | 'not-started',
        createdAt: item.created_at || "",
        isRecurring: item.is_recurring || false,
        isCustomerRelated: item.is_customer_related || false,
        customerName: item.customer_name || "",
        recurringFrequency: item.recurring_frequency || "",
        attachmentsRequired: item.attachments_required as 'none' | 'optional' | 'required',
        // Remove the assigneeDetails that was causing the issue
        assigneeDetails: undefined,
        approvalStatus: item.approval_status as 'pending' | 'approved' | 'rejected' | undefined,
        approvedBy: item.approved_by,
        approvedAt: item.approved_at,
        rejectedBy: item.rejected_by,
        rejectedAt: item.rejected_at,
        rejectionReason: item.rejection_reason,
        departmentHeadId: item.department_head_id
      }));

      return tasks;
    }
  });
};
