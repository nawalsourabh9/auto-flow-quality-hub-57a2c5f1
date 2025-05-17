
import React, { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
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
  setAttachmentsRequired,
}) => {
  // Log the initial value of assignee on render
  useEffect(() => {
    console.log("TaskAttributes rendered with assignee:", assignee);
    console.log("TaskAttributes received employees:", employees);
    if (employees.length > 0) {
      console.log("Employee IDs available:", employees.map(emp => emp.id));
      if (assignee && assignee !== "unassigned") {
        const validEmployee = employees.some(emp => emp.id === assignee);
        console.log(`Assignee ID ${assignee} validated as ${validEmployee ? 'existing' : 'NOT FOUND'} in employees list.`);
      }
    }
  }, [assignee, employees]);

  // Convert string date to Date object for the calendar
  const dateValue = dueDate ? parse(dueDate, "yyyy-MM-dd", new Date()) : undefined;

  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      console.log("Selected date:", formattedDate);
      setDueDate(formattedDate);
    } else {
      setDueDate("");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Task Attributes</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Department */}
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Quality">Quality</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Production">Production</SelectItem>
              <SelectItem value="HR">Human Resources</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="IT">Information Technology</SelectItem>
              <SelectItem value="Executive">Executive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(parse(dueDate, "yyyy-MM-dd", new Date()), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={handleDateSelect}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Assignee */}
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

        {/* Attachments Required */}
        <div className="space-y-2">
          <Label htmlFor="attachmentsRequired">Attachments</Label>
          <Select value={attachmentsRequired} onValueChange={setAttachmentsRequired}>
            <SelectTrigger>
              <SelectValue placeholder="Select attachment requirement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="optional">Optional</SelectItem>
              <SelectItem value="required">Required</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
