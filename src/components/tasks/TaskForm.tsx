
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Task } from "@/types/task";
import { Separator } from "@/components/ui/separator";

// Import components
import { TaskBasicInfo } from "./form/TaskBasicInfo";
import { TaskAttributes } from "./form/TaskAttributes";
import { DocumentSelector } from "./form/DocumentSelector";
import { CustomerRelatedSection } from "./form/CustomerRelatedSection";
import { RecurringTaskSection } from "./form/RecurringTaskSection";

// Import hooks
import { useTaskFormState } from "./form/useTaskFormState";
import { useTaskFormSubmit } from "./form/useTaskFormSubmit";

interface TaskFormProps {
  onSubmit: (task: Task) => void;
  initialData?: Partial<Task>;
}

const TaskForm: React.FC<TaskFormProps> = ({
  onSubmit,
  initialData = {}
}) => {
  // Use the form state hook to manage all form state
  const formState = useTaskFormState(initialData);
  
  // Use the form submit hook for submission logic
  const { handleSubmit } = useTaskFormSubmit(onSubmit, initialData, formState.employees);
  
  // Log initial data on mount
  useEffect(() => {
    if (initialData.id) {
      console.log("TaskForm is in EDIT mode with ID:", initialData.id);
    } else {
      console.log("TaskForm is in CREATE mode");
    }
    
    console.log("Initial data in TaskForm:", {
      ...initialData,
      recurrenceCountInPeriod: {
        value: initialData.recurrenceCountInPeriod,
        type: typeof initialData.recurrenceCountInPeriod
      }
    });
    
    if (initialData.assignee) {
      console.log("Setting initial assignee from props:", initialData.assignee);
    } else {
      console.log("No initial assignee in props, using unassigned");
    }
  }, [initialData.id]);

  // Create a submit handler that uses the form state
  const onFormSubmit = (e: React.FormEvent) => {
    // Ensure we never pass invalid recurrence count data from the form
    const formData = {
      title: formState.title,
      description: formState.description,
      department: formState.department,
      priority: formState.priority,
      dueDate: formState.dueDate,
      assignee: formState.assignee,
      isRecurring: formState.isRecurring,
      recurringFrequency: formState.isRecurring ? formState.recurringFrequency : undefined,
      startDate: formState.isRecurring ? formState.startDate : undefined,
      endDate: formState.isRecurring ? formState.endDate : undefined,
      isCustomerRelated: formState.isCustomerRelated,
      customerName: formState.customerName,
      attachmentsRequired: formState.attachmentsRequired,
      documentUploads: formState.documentUploads
    };

    console.log("TaskForm submitting clean form data (no recurrenceCountInPeriod):", formData);
    
    handleSubmit(e, formData);
  };

  return (
    <form onSubmit={onFormSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-1 gap-4">
        {/* Task basic info section */}
        <TaskBasicInfo 
          title={formState.title}
          setTitle={formState.setTitle}
          description={formState.description}
          setDescription={formState.setDescription}
        />

        {/* Task attributes section */}
        <TaskAttributes 
          department={formState.department}
          setDepartment={formState.setDepartment}
          priority={formState.priority}
          setPriority={formState.setPriority}
          dueDate={formState.dueDate}
          setDueDate={formState.setDueDate}
          assignee={formState.assignee}
          setAssignee={formState.setAssignee}
          employees={formState.employees}
          isLoading={formState.isLoading}
          attachmentsRequired={formState.attachmentsRequired}
          setAttachmentsRequired={formState.setAttachmentsRequired}
        />
        
        <Separator className="my-2" />
        
        {/* Recurring task section */}
        <div>
          <h3 className="text-sm font-medium mb-3">Recurring Options</h3>
          <RecurringTaskSection 
            isRecurring={formState.isRecurring}
            setIsRecurring={formState.setIsRecurring}
            recurringFrequency={formState.recurringFrequency}
            setRecurringFrequency={formState.setRecurringFrequency}
            startDate={formState.startDate}
            setStartDate={formState.setStartDate}
            endDate={formState.endDate}
            setEndDate={formState.setEndDate}
          />
        </div>
        
        {/* Documents section */}
        <div>
          <h3 className="text-sm font-medium mb-3">Documents</h3>
          <DocumentSelector 
            documentUploads={formState.documentUploads}
            onDocumentSelect={formState.handleDocumentSelect}
            onFileUpload={formState.handleFileUpload}
          />
        </div>

        {/* Customer related section */}
        <CustomerRelatedSection 
          isCustomerRelated={formState.isCustomerRelated}
          setIsCustomerRelated={formState.setIsCustomerRelated}
          customerName={formState.customerName}
          setCustomerName={formState.setCustomerName}
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
