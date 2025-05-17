
import { useState } from "react";
import { Task } from "@/types/task";
import { TaskDocument } from "@/types/document";
import { Employee } from "./useEmployeeData";

export const useTaskFormSubmit = (
  onSubmit: (task: Task) => void,
  initialData: Partial<Task> = {},
  employees: Employee[]
) => {
  // Find the selected employee details
  const getAssigneeDetails = (assigneeId: string | null) => {
    if (!assigneeId) {
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
    
    return documents;
  };

  const handleSubmit = (
    e: React.FormEvent,
    formData: {
      title: string;
      description: string;
      department: string;
      priority: "low" | "medium" | "high";
      dueDate: string;
      assignee: string;
      isCustomerRelated: boolean;
      customerName: string;
      attachmentsRequired: "none" | "optional" | "required";
      documentUploads: any;
    }
  ) => {
    e.preventDefault();
    
    // Log form values before submission
    console.log("Form submitted with fields:", formData);
    console.log("Form submitted with assignee:", formData.assignee);
    
    // Find the selected employee details
    const assigneeDetails = getAssigneeDetails(
      formData.assignee === "unassigned" ? null : formData.assignee
    );
    
    // Prepare documents
    const documents = prepareDocuments(formData.documentUploads, assigneeDetails);

    // Create the task object with the proper assignee value
    const finalAssignee = formData.assignee === "unassigned" ? null : formData.assignee;
    console.log("Final assignee value for task object:", finalAssignee);

    // Create the task object
    const newTask: Task = {
      id: initialData.id || "",
      title: formData.title,
      description: formData.description,
      department: formData.department,
      assignee: finalAssignee,
      priority: formData.priority,
      dueDate: formData.dueDate,
      status: initialData.status || "not-started",
      createdAt: initialData.createdAt || new Date().toISOString().split("T")[0],
      isRecurring: initialData.isRecurring || false,
      isCustomerRelated: formData.isCustomerRelated,
      customerName: formData.isCustomerRelated ? formData.customerName : undefined,
      attachmentsRequired: formData.attachmentsRequired,
      assigneeDetails,
      documents: documents.length > 0 ? documents : undefined
    };

    console.log("Submitting task with final data:", newTask);
    onSubmit(newTask);
  };

  return {
    handleSubmit
  };
};
