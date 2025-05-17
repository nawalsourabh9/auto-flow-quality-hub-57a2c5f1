
import { useState } from "react";
import { Task } from "@/types/task";
import { useEmployeeData } from "./useEmployeeData";
import { useDocumentUploads } from "./useDocumentUploads";

export const useTaskFormState = (initialData: Partial<Task> = {}) => {
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

  return {
    // Form state
    title,
    setTitle,
    description,
    setDescription,
    department,
    setDepartment,
    priority,
    setPriority,
    dueDate,
    setDueDate,
    assignee,
    setAssignee,
    attachmentsRequired,
    setAttachmentsRequired,
    isCustomerRelated,
    setIsCustomerRelated,
    customerName,
    setCustomerName,
    
    // Employee data
    employees,
    isLoading,
    
    // Document uploads
    documentUploads,
    handleDocumentSelect,
    handleFileUpload
  };
};
