
import { useState, useEffect } from "react";
import { Task } from "@/types/task";
import { useEmployeeData } from "./useEmployeeData";
import { useDocumentUploads } from "./useDocumentUploads";

export const useTaskFormState = (initialData: Partial<Task>) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [department, setDepartment] = useState(initialData?.department || "Quality");
  const [priority, setPriority] = useState<"low" | "medium" | "high">(initialData?.priority || "medium");
  const [dueDate, setDueDate] = useState(initialData?.dueDate || "");
  const [assignee, setAssignee] = useState(initialData?.assignee || "unassigned");
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);
  const [recurringFrequency, setRecurringFrequency] = useState(initialData?.recurringFrequency || "weekly");
  const [startDate, setStartDate] = useState(initialData?.startDate || "");
  const [endDate, setEndDate] = useState(initialData?.endDate || "");
  const [isCustomerRelated, setIsCustomerRelated] = useState(initialData?.isCustomerRelated || false);
  const [customerName, setCustomerName] = useState(initialData?.customerName || "");
  const [attachmentsRequired, setAttachmentsRequired] = useState<"none" | "optional" | "required">(
    initialData?.attachmentsRequired || "none"
  );

  // Employee data hook
  const { employees, isLoading } = useEmployeeData();

  // Document uploads hook
  const { documentUploads, handleDocumentSelect, handleFileUpload } = useDocumentUploads(initialData?.documents);

  // Update form state when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData?.id) {
      console.log("Updating form state with initial data:", initialData);
      
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setDepartment(initialData.department || "Quality");
      setPriority(initialData.priority || "medium");
      setDueDate(initialData.dueDate || "");
      setAssignee(initialData.assignee || "unassigned");
      setIsRecurring(initialData.isRecurring || false);
      setRecurringFrequency(initialData.recurringFrequency || "weekly");
      
      // Fix: Properly handle start and end dates
      if (initialData.startDate) {
        console.log("Setting start date:", initialData.startDate);
        setStartDate(initialData.startDate);
      }
      if (initialData.endDate) {
        console.log("Setting end date:", initialData.endDate);
        setEndDate(initialData.endDate);
      }
      
      setIsCustomerRelated(initialData.isCustomerRelated || false);
      setCustomerName(initialData.customerName || "");
      setAttachmentsRequired(initialData.attachmentsRequired || "none");
    }
  }, [initialData?.id, initialData]);

  return {
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
    attachmentsRequired,
    setAttachmentsRequired,
    employees,
    isLoading,
    documentUploads,
    handleDocumentSelect,
    handleFileUpload
  };
};
