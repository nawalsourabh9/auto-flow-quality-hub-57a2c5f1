
import React, { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Employee } from "./useEmployeeData";

interface TaskAttributesProps {
  department: string;
  setDepartment: (value: string) => void;
  priority: "low" | "medium" | "high";
  setPriority: (value: "low" | "medium" | "high") => void;
  dueDate: string;
  setDueDate: (value: string) => void;
  assignee: string;
  setAssignee: (value: string) => void;
  employees: Employee[];
  isLoading: boolean;
  attachmentsRequired: "none" | "optional" | "required";
  setAttachmentsRequired: (value: "none" | "optional" | "required") => void;
}

export const TaskAttributes: React.FC<TaskAttributesProps> = ({
  department,
  setDepartment,
  priority,
  setPriority,
  dueDate,
  setDueDate,
  assignee,
  setAssignee,
  employees,
  isLoading,
  attachmentsRequired,
  setAttachmentsRequired
}) => {
  // Log employee data when component renders
  useEffect(() => {
    console.log("TaskAttributes received employees:", employees);
    console.log("Current assignee value:", assignee);
    console.log("Employee IDs available:", employees.map(e => e.id));
  }, [employees, assignee]);

  // Validate that the assignee value exists in the employees array if it's not "unassigned"
  useEffect(() => {
    if (assignee && assignee !== "unassigned" && employees.length > 0) {
      const employeeExists = employees.some(emp => emp.id === assignee);
      if (!employeeExists) {
        console.warn(`Selected assignee ID ${assignee} does not exist in employees list!`);
      } else {
        console.log(`Assignee ID ${assignee} validated as existing in employees list.`);
      }
    }
  }, [assignee, employees]);
  
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="department" className="block text-sm font-medium mb-1">
            Department <span className="text-destructive">*</span>
          </label>
          <Select value={department} onValueChange={setDepartment} required>
            <SelectTrigger className="border border-input rounded-md">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Quality">Quality</SelectItem>
              <SelectItem value="Production">Production</SelectItem>
              <SelectItem value="Regulatory">Regulatory</SelectItem>
              <SelectItem value="EHS">EHS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium mb-1">
            Priority <span className="text-destructive">*</span>
          </label>
          <Select 
            value={priority} 
            onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}
          >
            <SelectTrigger className="border border-input rounded-md">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium mb-1">
            Due Date <span className="text-destructive">*</span>
          </label>
          <Input 
            id="dueDate" 
            type="date" 
            value={dueDate} 
            onChange={e => setDueDate(e.target.value)} 
            required 
            className="border border-input rounded-md" 
          />
        </div>

        <div>
          <label htmlFor="assignee" className="block text-sm font-medium mb-1">
            Assignee
          </label>
          <Select 
            value={assignee} 
            onValueChange={(value) => {
              console.log("Assignee selected:", value);
              setAssignee(value);
            }}
          >
            <SelectTrigger className="border border-input rounded-md">
              <SelectValue placeholder={isLoading ? "Loading employees..." : "Select assignee"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">No assignee</SelectItem>
              {employees.map(employee => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name} ({employee.employee_id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground mt-1">
            {assignee !== "unassigned" ? 
              (employees.find(e => e.id === assignee) ? 
                `Selected: ${employees.find(e => e.id === assignee)?.name} (ID: ${assignee})` : 
                `ID: ${assignee} (Employee not found in list)`) : 
              "No assignee selected"}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="attachments" className="block text-sm font-medium mb-1">
          Attachments
        </label>
        <Select 
          value={attachmentsRequired} 
          onValueChange={(value: "none" | "optional" | "required") => setAttachmentsRequired(value)}
        >
          <SelectTrigger className="border border-input rounded-md">
            <SelectValue placeholder="Attachment requirements" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="optional">Optional</SelectItem>
            <SelectItem value="required">Required</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
};
