
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Task } from "@/types/task";
import { Separator } from "@/components/ui/separator";
import { TaskDocument } from "@/types/document";

// Import new components
import { TaskBasicInfo } from "./form/TaskBasicInfo";
import { TaskAttributes } from "./form/TaskAttributes";
import { DocumentSelector } from "./form/DocumentSelector";
import { CustomerRelatedSection } from "./form/CustomerRelatedSection";
import { useDocumentUploads } from "./form/useDocumentUploads";
import { useEmployeeData } from "./form/useEmployeeData";

interface TaskFormProps {
  onSubmit: (task: Task) => void;
  initialData?: Partial<Task>;
}

const TaskForm: React.FC<TaskFormProps> = ({
  onSubmit,
  initialData = {}
}) => {
  // Basic task information
  const [title, setTitle] = useState(initialData.title || "");
  const [description, setDescription] = useState(initialData.description || "");
  
  // Task attributes
  const [department, setDepartment] = useState(initialData.department || "");
  const [priority, setPriority] = useState<"low" | "medium" | "high">(initialData.priority || "medium");
  const [dueDate, setDueDate] = useState(initialData.dueDate || "");
  const [assignee, setAssignee] = useState<string>(initialData.assignee || "unassigned");
  const [attachmentsRequired, setAttachmentsRequired] = useState<"none" | "optional" | "required">(
    initialData.attachmentsRequired || "optional"
  );
  
  // Customer related fields
  const [isCustomerRelated, setIsCustomerRelated] = useState(initialData.isCustomerRelated || false);
  const [customerName, setCustomerName] = useState(initialData.customerName || "");
  
  // Fetch employees
  const { employees, isLoading } = useEmployeeData();
  
  // Document uploads management
  const { 
    documentUploads, 
    handleDocumentSelect, 
    handleFileUpload 
  } = useDocumentUploads(initialData.documents);

  // Set initial assignee from props
  useEffect(() => {
    if (initialData.id) {
      console.log("TaskForm is in EDIT mode with ID:", initialData.id);
    } else {
      console.log("TaskForm is in CREATE mode");
    }
    
    console.log("Initial data in TaskForm:", initialData);
    
    // Only log this message on mount, not when assignee changes
    if (initialData.assignee) {
      console.log("Setting initial assignee from props:", initialData.assignee);
    } else {
      console.log("No initial assignee in props, using unassigned");
    }
  }, [initialData.id]); // Only run once on mount or when ID changes

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Log form values before submission
    console.log("Form submitted with fields:", {
      title,
      description,
      department,
      priority,
      dueDate,
      assignee,
      isCustomerRelated,
      customerName,
      attachmentsRequired
    });
    
    console.log("Form submitted with assignee:", assignee);
    
    // Find the selected employee details
    const selectedEmployee = employees.find(emp => emp.id === assignee);
    let assigneeDetails = {
      name: "",
      initials: "",
      department: department,
      position: ""
    };
    
    if (selectedEmployee) {
      // Get initials from name (e.g., "John Doe" -> "JD")
      const initials = selectedEmployee.name.split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase();
        
      assigneeDetails = {
        name: selectedEmployee.name,
        initials: initials,
        department: selectedEmployee.department,
        position: selectedEmployee.position
      };
      
      console.log("Found assignee details:", assigneeDetails);
    }

    // Prepare documents array
    const documents: TaskDocument[] = [];
    
    if (documentUploads.sop.selected) {
      documents.push({
        id: `doc-sop-${Math.random().toString(36).substring(2, 9)}`,
        fileName: documentUploads.sop.file?.name || "Standard Operating Procedure",
        fileType: documentUploads.sop.file?.type || "pdf",
        documentType: "sop",
        version: "1.0",
        uploadDate: new Date().toISOString(),
        uploadedBy: assigneeDetails.name,
        file: documentUploads.sop.file // Add the actual file to upload
      });
    }
    
    if (documentUploads.dataFormat.selected) {
      documents.push({
        id: `doc-df-${Math.random().toString(36).substring(2, 9)}`,
        fileName: documentUploads.dataFormat.file?.name || "Data Recording Format",
        fileType: documentUploads.dataFormat.file?.type || "xlsx",
        documentType: "dataFormat",
        version: "1.0",
        uploadDate: new Date().toISOString(),
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
        uploadDate: new Date().toISOString(),
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
        uploadDate: new Date().toISOString(),
        uploadedBy: assigneeDetails.name,
        file: documentUploads.rulesAndProcedures.file
      });
    }

    // Create the task object with the proper assignee value
    const finalAssignee = assignee === "unassigned" ? null : assignee;
    console.log("Final assignee value for task object:", finalAssignee);

    // Create the task object
    const newTask: Task = {
      id: initialData.id || "",
      title,
      description,
      department,
      assignee: finalAssignee,
      priority,
      dueDate,
      status: initialData.status || "not-started",
      createdAt: initialData.createdAt || new Date().toISOString().split("T")[0],
      isRecurring: initialData.isRecurring || false,
      isCustomerRelated,
      customerName: isCustomerRelated ? customerName : undefined,
      attachmentsRequired,
      assigneeDetails,
      documents: documents.length > 0 ? documents : undefined
    };

    console.log("Submitting task with final data:", newTask);
    onSubmit(newTask);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-1 gap-4">
        {/* Task basic info section */}
        <TaskBasicInfo 
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
        />

        {/* Task attributes section */}
        <TaskAttributes 
          department={department}
          setDepartment={setDepartment}
          priority={priority}
          setPriority={setPriority}
          dueDate={dueDate}
          setDueDate={setDueDate}
          assignee={assignee}
          setAssignee={setAssignee}
          employees={employees}
          isLoading={isLoading}
          attachmentsRequired={attachmentsRequired}
          setAttachmentsRequired={setAttachmentsRequired}
        />
        
        <Separator className="my-2" />
        
        {/* Documents section */}
        <div>
          <h3 className="text-sm font-medium mb-3">Documents</h3>
          <DocumentSelector 
            documentUploads={documentUploads}
            onDocumentSelect={handleDocumentSelect}
            onFileUpload={handleFileUpload}
          />
        </div>

        {/* Customer related section */}
        <CustomerRelatedSection 
          isCustomerRelated={isCustomerRelated}
          setIsCustomerRelated={setIsCustomerRelated}
          customerName={customerName}
          setCustomerName={setCustomerName}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" className="px-6">
          {initialData.id ? "Update Task" : "Create Task"}
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;
