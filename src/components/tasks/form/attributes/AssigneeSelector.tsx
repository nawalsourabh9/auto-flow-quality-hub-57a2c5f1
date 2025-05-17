
import React, { useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Employee } from "../useEmployeeData";

interface AssigneeSelectorProps {
  assignee: string;
  setAssignee: (value: string) => void;
  employees: Employee[];
  isLoading: boolean;
}

export const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({
  assignee,
  setAssignee,
  employees,
  isLoading,
}) => {
  // Log when component renders
  useEffect(() => {
    if (employees.length > 0) {
      console.log("AssigneeSelector rendered with employees:", employees.length);
      if (assignee && assignee !== "unassigned") {
        const validEmployee = employees.some(emp => emp.id === assignee);
        console.log(`Assignee ID ${assignee} validated as ${validEmployee ? 'existing' : 'NOT FOUND'} in employees list.`);
      }
    }
  }, [assignee, employees]);
  
  return (
    <div className="space-y-2">
      <Label htmlFor="assignee">Assignee</Label>
      <Select value={assignee} onValueChange={setAssignee}>
        <SelectTrigger>
          <SelectValue placeholder="Select assignee" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {employees.map((employee) => (
            <SelectItem key={employee.id} value={employee.id}>
              {employee.name} ({employee.department})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
