import { Task } from "@/types/task";
import { TaskDocument } from "@/types/document";
import { Employee } from "./useEmployeeData";
import { useTaskDocumentUpload } from "@/hooks/use-task-document-upload";
import { addMonths, parseISO, isAfter, isBefore } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { formatDateForInput, parseInputDate, isValidDateString } from "@/utils/dateUtils";

export const useTaskFormSubmit = (
  onSubmit: (task: Task) => void,
  initialData: Partial<Task> = {},
  employees: Employee[]
) => {
  const { processTaskDocuments } = useTaskDocumentUpload();

  // Find the selected employee details
  const getAssigneeDetails = (assigneeId: string | null) => {
    if (!assigneeId || assigneeId === "unassigned") {
      return {
        name: "",
        initials: "",
        department: "",
        position: ""
      };
    }

    const selectedEmployee = employees.find(emp => emp.id === assigneeId);
    
    if (selectedEmployee) {
      // Get initials from name (e.g., "John Doe" -> "JD")
      const initials = selectedEmployee.name.split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase();
        
      return {
        name: selectedEmployee.name,
        initials: initials,
        department: selectedEmployee.department,
        position: selectedEmployee.position
      };
    }
    
    return {
      name: "",
      initials: "",
      department: "",
      position: ""
    };
  };

  // Prepare documents array
  const prepareDocuments = (
    documentUploads: any,
    assigneeDetails: { name: string }
  ): TaskDocument[] => {
    const documents: TaskDocument[] = [];
    const timestamp = new Date().toISOString();
    
    if (documentUploads.sop.selected) {
      documents.push({
        id: `doc-sop-${Math.random().toString(36).substring(2, 9)}`,
        fileName: documentUploads.sop.file?.name || "Standard Operating Procedure",
        fileType: documentUploads.sop.file?.type || "pdf",
        documentType: "sop",
        version: "1.0",
        uploadDate: timestamp,
        uploadedBy: assigneeDetails.name,
        file: documentUploads.sop.file
      });
    }
    
    if (documentUploads.dataFormat.selected) {
      documents.push({
        id: `doc-df-${Math.random().toString(36).substring(2, 9)}`,
        fileName: documentUploads.dataFormat.file?.name || "Data Recording Format",
        fileType: documentUploads.dataFormat.file?.type || "xlsx",
        documentType: "dataFormat",
        version: "1.0",
        uploadDate: timestamp,
        uploadedBy: assigneeDetails.name,
        file: documentUploads.dataFormat.file
      });
    }
    
    if (documentUploads.reportFormat.selected) {
      documents.push({
        id: `doc-rf-${Math.random().toString(36).substring(2, 9)}`,
        fileName: documentUploads.reportFormat.file?.name || "Report Format",
        fileType: documentUploads.reportFormat.file?.type || "docx",
        documentType: "reportFormat",
        version: "1.0",
        uploadDate: timestamp,
        uploadedBy: assigneeDetails.name,
        file: documentUploads.reportFormat.file
      });
    }
    
    if (documentUploads.rulesAndProcedures.selected) {
      documents.push({
        id: `doc-rp-${Math.random().toString(36).substring(2, 9)}`,
        fileName: documentUploads.rulesAndProcedures.file?.name || "Rules and Procedures",
        fileType: documentUploads.rulesAndProcedures.file?.type || "pdf",
        documentType: "rulesAndProcedures",
        version: "1.0",
        uploadDate: timestamp,
        uploadedBy: assigneeDetails.name,
        file: documentUploads.rulesAndProcedures.file
      });
    }

    console.log("Prepared documents for submission:", documents);
    return documents;
  };

  // Enhanced date validation with better error messages
  const validateRecurringDates = (
    isRecurring: boolean,
    startDate: string | undefined,
    endDate: string | undefined
  ): { isValid: boolean; error?: string } => {
    if (!isRecurring) return { isValid: true };
    
    // If recurring, both dates are required
    if (!startDate || !endDate) {
      return { 
        isValid: false, 
        error: "Start date and end date are required for recurring tasks" 
      };
    }
    
    // Validate date format
    if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
      return { 
        isValid: false, 
        error: "Invalid date format provided" 
      };
    }
    
    try {
      const start = parseInputDate(startDate);
      const end = parseInputDate(endDate);
      
      if (!start || !end) {
        return { 
          isValid: false, 
          error: "Unable to parse provided dates" 
        };
      }
      
      const maxEndDate = addMonths(start, 6);
      
      // End date must be after start date
      if (!isAfter(end, start)) {
        return { 
          isValid: false, 
          error: "End date must be after start date" 
        };
      }
      
      // End date must be within 6 months
      if (!isBefore(end, maxEndDate)) {
        return { 
          isValid: false, 
          error: "End date must be within 6 months of start date" 
        };
      }
      
      return { isValid: true };
    } catch (error) {
      console.error("Date validation error:", error);
      return { 
        isValid: false, 
        error: "Error validating dates" 
      };
    }
  };

  const handleSubmit = async (
    e: React.FormEvent,
    formData: {
      title: string;
      description: string;
      department: string;
      priority: "low" | "medium" | "high";
      dueDate: string;
      assignee: string;
      isRecurring: boolean;
      recurringFrequency?: string;
      startDate?: string;
      endDate?: string;
      isCustomerRelated: boolean;
      customerName: string;
      attachmentsRequired: "none" | "optional" | "required";
      documentUploads: any;
    }
  ) => {
    e.preventDefault();
    
    // Enhanced date validation
    const dateValidation = validateRecurringDates(
      formData.isRecurring, 
      formData.startDate, 
      formData.endDate
    );
    
    if (!dateValidation.isValid) {
      toast({
        title: "Validation Error",
        description: dateValidation.error,
        variant: "destructive"
      });
      return;
    }
    
    // Validate due date format
    if (formData.dueDate && !isValidDateString(formData.dueDate)) {
      toast({
        title: "Validation Error",
        description: "Invalid due date format",
        variant: "destructive"
      });
      return;
    }
    
    // Log form values before submission with enhanced date info
    console.log("Form submitted with enhanced date handling:", {
      ...formData,
      dateValidation: dateValidation,
      formattedDates: {
        due: formatDateForInput(formData.dueDate),
        start: formData.startDate ? formatDateForInput(formData.startDate) : undefined,
        end: formData.endDate ? formatDateForInput(formData.endDate) : undefined
      }
    });
    
    // Find the selected employee details
    const assigneeDetails = getAssigneeDetails(
      formData.assignee === "unassigned" ? null : formData.assignee
    );
    
    // Prepare documents
    const documents = prepareDocuments(formData.documentUploads, assigneeDetails);

    // Create the task object with proper assignee value and formatted dates
    const finalAssignee = formData.assignee === "unassigned" ? null : formData.assignee;
    
    const newTask: Task = {
      id: initialData.id || "",
      title: formData.title,
      description: formData.description,
      department: formData.department,
      assignee: finalAssignee,
      priority: formData.priority,
      dueDate: formatDateForInput(formData.dueDate),
      status: initialData.status || "not-started",
      createdAt: initialData.createdAt || new Date().toISOString().split("T")[0],
      isRecurring: formData.isRecurring,
      recurringFrequency: formData.isRecurring ? formData.recurringFrequency : undefined,
      startDate: formData.isRecurring ? formatDateForInput(formData.startDate) : undefined,
      endDate: formData.isRecurring ? formatDateForInput(formData.endDate) : undefined,
      isCustomerRelated: formData.isCustomerRelated,
      customerName: formData.isCustomerRelated ? formData.customerName : undefined,
      attachmentsRequired: formData.attachmentsRequired,
      assigneeDetails,
      documents: documents.length > 0 ? documents : undefined
    };

    console.log("Submitting task with standardized date formatting:", newTask);
    
    // Submit the task first
    onSubmit(newTask);
    
    // If there are documents and the task has an ID, process them
    if (documents.length > 0 && newTask.id) {
      console.log(`Processing ${documents.length} documents for task ${newTask.id}`);
      await processTaskDocuments(newTask.id, documents);
    }
  };

  return {
    handleSubmit
  };
};
