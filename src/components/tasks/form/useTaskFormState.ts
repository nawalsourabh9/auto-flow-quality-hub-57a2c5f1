
import { useState, useEffect } from "react";
import { Task } from "@/types/task";
import { useEmployeeData } from "./useEmployeeData";
import { useDocumentUploads } from "./useDocumentUploads";
import { formatDateForInput } from "@/utils/dateUtils";

export const useTaskFormState = (initialData: Partial<Task>) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [department, setDepartment] = useState(initialData?.department || "Quality");
  const [priority, setPriority] = useState<"low" | "medium" | "high">(initialData?.priority || "medium");
  const [dueDate, setDueDate] = useState(formatDateForInput(initialData?.dueDate));
  const [assignee, setAssignee] = useState(initialData?.assignee || "unassigned");
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);
  const [recurringFrequency, setRecurringFrequency] = useState(initialData?.recurringFrequency || "weekly");
  const [startDate, setStartDate] = useState<string | null>(formatDateForInput(initialData?.startDate));
  const [endDate, setEndDate] = useState<string | null>(formatDateForInput(initialData?.endDate));
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
    console.log("useTaskFormState: Initial data changed:", {
      id: initialData?.id,
      hasData: !!Object.keys(initialData || {}).length,
      dueDate: initialData?.dueDate,
      startDate: initialData?.startDate,
      endDate: initialData?.endDate,
      isRecurring: initialData?.isRecurring,
      rawStartDate: initialData?.startDate,
      rawEndDate: initialData?.endDate
    });

    // Always update form state when initialData changes, regardless of ID
    if (initialData && Object.keys(initialData).length > 0) {
      console.log("Updating form state with initial data");
      
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setDepartment(initialData.department || "Quality");
      setPriority(initialData.priority || "medium");
      setAssignee(initialData.assignee || "unassigned");
      setIsRecurring(initialData.isRecurring || false);
      setRecurringFrequency(initialData.recurringFrequency || "weekly");
      setIsCustomerRelated(initialData.isCustomerRelated || false);
      setCustomerName(initialData.customerName || "");
      setAttachmentsRequired(initialData.attachmentsRequired || "none");

      // Handle dates with proper formatting and debugging
      const formattedDueDate = formatDateForInput(initialData.dueDate);
      const formattedStartDate = formatDateForInput(initialData.startDate);
      const formattedEndDate = formatDateForInput(initialData.endDate);

      console.log("Date formatting debug:", {
        original: { 
          due: initialData.dueDate, 
          start: initialData.startDate, 
          end: initialData.endDate 
        },
        formatted: { 
          due: formattedDueDate, 
          start: formattedStartDate, 
          end: formattedEndDate 
        },
        types: {
          originalStart: typeof initialData.startDate,
          originalEnd: typeof initialData.endDate,
          formattedStart: typeof formattedStartDate,
          formattedEnd: typeof formattedEndDate
        }
      });

      setDueDate(formattedDueDate);
      setStartDate(formattedStartDate);
      setEndDate(formattedEndDate);

      console.log("Form state updated - dates set to:", {
        startDate: formattedStartDate,
        endDate: formattedEndDate
      });
    } else {
      console.log("No initial data provided or empty object, using defaults");
    }
  }, [initialData]); // Remove the ID dependency to ensure all updates trigger

  // Debug effect to track state changes
  useEffect(() => {
    console.log("Form state changed - current values:", {
      startDate,
      endDate,
      isRecurring
    });
  }, [startDate, endDate, isRecurring]);

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
