
import { useState, useEffect } from "react";
import { Task } from "@/types/task";
import { useEmployeeData } from "./useEmployeeData";
import { useDocumentUploads } from "./useDocumentUploads";

export const useTaskFormState = (initialData: Partial<Task> = {}) => {
  console.log("Initialize TaskFormState with:", initialData);
  
  // Basic task information
  const [title, setTitle] = useState(initialData.title || "");
  const [description, setDescription] = useState(initialData.description || "");
  
  // Task attributes
  const [department, setDepartment] = useState(initialData.department || "");
  const [priority, setPriority] = useState<"low" | "medium" | "high">(initialData.priority || "medium");
  
  // Properly format the date if it exists
  const formatInitialDate = (dateValue: string | undefined): string => {
    if (!dateValue) return "";
    
    // If the date is already in yyyy-MM-dd format, return it
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // If it's an ISO date string with time (yyyy-MM-ddTHH:mm:ss)
    if (dateValue.includes('T')) {
      try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
          console.error("Invalid date:", dateValue);
          return "";
        }
        return date.toISOString().split('T')[0];
      } catch (error) {
        console.error("Error parsing date:", error);
        return "";
      }
    }
    
    return dateValue;
  };
  
  const [dueDate, setDueDate] = useState(formatInitialDate(initialData.dueDate));
  const [assignee, setAssignee] = useState<string>(initialData.assignee || "unassigned");
  const [attachmentsRequired, setAttachmentsRequired] = useState<"none" | "optional" | "required">(
    initialData.attachmentsRequired || "optional"
  );
  
  // Recurring task options
  const [isRecurring, setIsRecurring] = useState(initialData.isRecurring || false);
  const [recurringFrequency, setRecurringFrequency] = useState(initialData.recurringFrequency || "weekly");
  const [startDate, setStartDate] = useState(formatInitialDate(initialData.startDate) || formatInitialDate(new Date().toISOString()));
  const [endDate, setEndDate] = useState(formatInitialDate(initialData.endDate) || "");
  
  // Customer related fields
  const [isCustomerRelated, setIsCustomerRelated] = useState(initialData.isCustomerRelated || false);
  const [customerName, setCustomerName] = useState(initialData.customerName || "");
  
  // Log when date fields change
  useEffect(() => {
    console.log("Due date set to:", dueDate);
  }, [dueDate]);
  
  useEffect(() => {
    console.log("Recurring dates set to - Start:", startDate, "End:", endDate);
  }, [startDate, endDate]);
  
  // Log when assignee changes
  useEffect(() => {
    console.log("Assignee set to:", assignee);
  }, [assignee]);
  
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
    isRecurring,
    setIsRecurring,
    recurringFrequency,
    setRecurringFrequency,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
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
