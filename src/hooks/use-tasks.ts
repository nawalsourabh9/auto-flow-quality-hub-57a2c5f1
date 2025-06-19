import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";

export const useTasks = () => {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      console.log("useTasks: Fetching tasks from database...");
      
      // Fetch tasks with new fields
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (tasksError) {
        console.error("useTasks: Error fetching tasks:", tasksError);
        throw tasksError;
      }      console.log(`useTasks: Retrieved ${tasksData.length} tasks`);
      
      // Debug: Check if is_template field exists in the data
      if (tasksData.length > 0) {
        console.log('Sample task fields:', Object.keys(tasksData[0]));
        console.log('Does is_template exist?', 'is_template' in tasksData[0]);
      }

      // Get unique employee IDs from tasks, filtering out null or empty values
      const employeeIds = tasksData
        .map(task => task.assignee)
        .filter(id => id && typeof id === 'string');
      
      console.log(`useTasks: Found ${employeeIds.length} unique assignees:`, employeeIds);
      
      // Fetch employee details if there are assignees
      let employeesData = [];
      if (employeeIds.length > 0) {
        const { data: empData, error: empError } = await supabase
          .from("employees")
          .select("*")
          .in("id", employeeIds);
          
        if (empError) {
          console.error("useTasks: Error fetching employees:", empError);
        } else {
          employeesData = empData || [];
          console.log(`useTasks: Retrieved ${employeesData.length} employee records`);
        }
      }

      // Fetch documents for all tasks
      const taskIds = tasksData.map(task => task.id);
      let documentsData = [];
      let documentRevisions = [];
      let approvalHierarchies = [];
      
      if (taskIds.length > 0) {
        // Fetch documents
        const { data: docs, error: docsError } = await supabase
          .from("documents")
          .select("*")
          .in("task_id", taskIds);
          
        if (docsError) {
          console.error("useTasks: Error fetching documents:", docsError);
        } else {
          documentsData = docs || [];
          console.log(`useTasks: Retrieved ${documentsData.length} documents for tasks`);
          
          // Get all document IDs to fetch their revisions
          const documentIds = documentsData.map(doc => doc.id);
          
          if (documentIds.length > 0) {
            // Fetch document revisions
            const { data: revisions, error: revisionsError } = await supabase
              .from("document_revisions")
              .select("*")
              .in("document_id", documentIds);
              
            if (revisionsError) {
              console.error("useTasks: Error fetching document revisions:", revisionsError);
            } else {
              documentRevisions = revisions || [];
              console.log(`useTasks: Retrieved ${documentRevisions.length} document revisions`);
            }
            
            // Fetch approval hierarchies
            const { data: approvals, error: approvalsError } = await supabase
              .from("approval_hierarchy")
              .select("*")
              .in("document_id", documentIds);
              
            if (approvalsError) {
              console.error("useTasks: Error fetching approval hierarchies:", approvalsError);
            } else {
              approvalHierarchies = approvals || [];
              console.log(`useTasks: Retrieved ${approvalHierarchies.length} approval hierarchies`);
            }
          }
        }
      }

      // Map the database fields to our Task interface - EXCLUDE recurrenceCountInPeriod
      const tasks: Task[] = tasksData.map(item => {
        // Find employee details
        const employee = employeesData.find(emp => emp.id === item.assignee);
        
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
        
        // Find documents for this task
        const taskDocuments = documentsData
          .filter(doc => doc.task_id === item.id)
          .map(doc => {
            // Find revisions for this document
            const revisions = documentRevisions
              .filter(rev => rev.document_id === doc.id)
              .map(rev => ({
                id: rev.id,
                fileName: rev.file_name,
                version: rev.version,
                uploadDate: rev.upload_date,
                uploadedBy: rev.uploaded_by,
                notes: rev.notes || ''
              }));
              
            // Find approval hierarchy for this document
            const approvalHierarchy = approvalHierarchies.find(a => a.document_id === doc.id);
            
            return {
              id: doc.id,
              fileName: doc.file_name,
              fileType: doc.file_type,
              version: doc.version,
              documentType: doc.document_type,
              uploadDate: doc.upload_date,
              uploadedBy: doc.uploaded_by,
              notes: doc.notes || '',
              currentRevisionId: doc.current_revision_id,
              revisions: revisions,
              approvalHierarchy: approvalHierarchy ? {
                initiator: approvalHierarchy.initiator,
                checker: approvalHierarchy.checker,
                approver: approvalHierarchy.approver,
                status: approvalHierarchy.status,
                initiatorApproved: approvalHierarchy.initiator_approved,
                checkerApproved: approvalHierarchy.checker_approved,
                approverApproved: approvalHierarchy.approver_approved,
                initiatedAt: approvalHierarchy.initiated_at,
                checkedAt: approvalHierarchy.checked_at,
                approvedAt: approvalHierarchy.approved_at,
                rejectedAt: approvalHierarchy.rejected_at,
                rejectedBy: approvalHierarchy.rejected_by,
                rejectionReason: approvalHierarchy.rejection_reason
              } : undefined
            };
          });        // Create clean task object - NEVER include recurrenceCountInPeriod
        const cleanTask: Task = {
          id: item.id,
          title: item.title,
          description: item.description || "",
          department: item.department,
          assignee: item.assignee || "unassigned",
          priority: item.priority as 'low' | 'medium' | 'high',
          dueDate: item.due_date || "",
          status: item.status as 'completed' | 'in-progress' | 'overdue' | 'not-started',
          createdAt: item.created_at || "",
          isRecurring: item.is_recurring || false,
          isTemplate: item.is_template || false, // Column exists, no type assertion needed
          isCustomerRelated: item.is_customer_related || false,
          customerName: item.customer_name || "",
          recurringFrequency: item.recurring_frequency || "",
          startDate: item.start_date,
          endDate: item.end_date,
          attachmentsRequired: item.attachments_required as 'none' | 'optional' | 'required',
          parentTaskId: item.parent_task_id,
          originalTaskName: item.original_task_name,
          lastGeneratedDate: item.last_generated_date,
          assigneeDetails,
          documents: taskDocuments.length > 0 ? taskDocuments : undefined,
          approvalStatus: item.approval_status as 'pending' | 'approved' | 'rejected' | undefined,
          approvedBy: item.approved_by,
          approvedAt: item.approved_at,
          rejectedBy: item.rejected_by,
          rejectedAt: item.rejected_at,
          rejectionReason: item.rejection_reason,
          departmentHeadId: item.department_head_id,          comments: item.comments
          // NOTE: recurrenceCountInPeriod is intentionally excluded to prevent frontend issues
        };

        return cleanTask;      });

      return tasks;
    }
  });
};
