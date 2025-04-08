
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/types/task";

interface TaskFormProps {
  onSubmit: (task: Task) => void;
  initialData?: Partial<Task>;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, initialData = {} }) => {
  const [title, setTitle] = useState(initialData.title || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [department, setDepartment] = useState(initialData.department || "");
  const [priority, setPriority] = useState<"low" | "medium" | "high">(initialData.priority || "medium");
  const [dueDate, setDueDate] = useState(initialData.dueDate || "");
  const [assignee, setAssignee] = useState(initialData.assignee || "");
  const [isCustomerRelated, setIsCustomerRelated] = useState(initialData.isCustomerRelated || false);
  const [customerName, setCustomerName] = useState(initialData.customerName || "");
  const [attachmentsRequired, setAttachmentsRequired] = useState<"none" | "optional" | "required">(
    initialData.attachmentsRequired || "optional"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Get assignee details based on selected assignee
    let assigneeDetails = {
      name: "",
      initials: "",
      department: department,
      position: ""
    };

    if (assignee === "JD") {
      assigneeDetails = {
        name: "John Doe",
        initials: "JD",
        department: department,
        position: "Process Engineer"
      };
    } else if (assignee === "SM") {
      assigneeDetails = {
        name: "Sarah Miller",
        initials: "SM",
        department: department,
        position: "Quality Specialist"
      };
    } else if (assignee === "RJ") {
      assigneeDetails = {
        name: "Robert Johnson",
        initials: "RJ",
        department: department,
        position: "Quality Manager"
      };
    }

    const newTask: Task = {
      id: initialData.id || "",
      title,
      description,
      department,
      assignee,
      priority,
      dueDate,
      status: initialData.status || "not-started",
      createdAt: initialData.createdAt || new Date().toISOString().split("T")[0],
      isRecurring: initialData.isRecurring || false,
      isCustomerRelated,
      customerName: isCustomerRelated ? customerName : undefined,
      attachmentsRequired,
      assigneeDetails
    };

    onSubmit(newTask);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Task Title <span className="text-destructive">*</span>
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Enter task title"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description <span className="text-destructive">*</span>
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Enter task description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="department" className="block text-sm font-medium mb-1">
              Department <span className="text-destructive">*</span>
            </label>
            <Select value={department} onValueChange={setDepartment} required>
              <SelectTrigger>
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
            <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium mb-1">
              Due Date <span className="text-destructive">*</span>
            </label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="assignee" className="block text-sm font-medium mb-1">
              Assignee
            </label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="JD">John Doe (JD)</SelectItem>
                <SelectItem value="SM">Sarah Miller (SM)</SelectItem>
                <SelectItem value="RJ">Robert Johnson (RJ)</SelectItem>
              </SelectContent>
            </Select>
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
            <SelectTrigger>
              <SelectValue placeholder="Attachment requirements" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="optional">Optional</SelectItem>
              <SelectItem value="required">Required</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isCustomerRelated"
            checked={isCustomerRelated}
            onChange={(e) => setIsCustomerRelated(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="isCustomerRelated" className="text-sm">
            Customer Related Task
          </label>
        </div>

        {isCustomerRelated && (
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium mb-1">
              Customer Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required={isCustomerRelated}
              placeholder="Enter customer name"
            />
          </div>
        )}
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
