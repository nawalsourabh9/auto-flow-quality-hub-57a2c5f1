
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/types/task";
import { Separator } from "@/components/ui/separator";
import { FileText, Database, PieChart, BookOpen } from "lucide-react";
import { TaskDocument } from "@/types/document";

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
  
  // Document selection states
  const [attachSOP, setAttachSOP] = useState(false);
  const [attachDataFormat, setAttachDataFormat] = useState(false);
  const [attachReportFormat, setAttachReportFormat] = useState(false);
  const [attachRulesAndProcedures, setAttachRulesAndProcedures] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<TaskDocument[]>(initialData.documents || []);

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

    // Create placeholder documents based on selections
    const documents: TaskDocument[] = [];
    
    // These would typically be populated from a documents library or selector
    // For now we're just creating placeholder entries to demonstrate the UI
    if (attachSOP) {
      documents.push({
        id: `doc-sop-${Math.random().toString(36).substring(2, 9)}`,
        fileName: "Standard Operating Procedure",
        fileType: "pdf",
        documentType: "sop",
        version: "1.0",
        uploadDate: new Date().toISOString(),
        uploadedBy: assigneeDetails.name,
      });
    }
    
    if (attachDataFormat) {
      documents.push({
        id: `doc-df-${Math.random().toString(36).substring(2, 9)}`,
        fileName: "Data Recording Format",
        fileType: "xlsx",
        documentType: "dataFormat",
        version: "1.0",
        uploadDate: new Date().toISOString(),
        uploadedBy: assigneeDetails.name,
      });
    }
    
    if (attachReportFormat) {
      documents.push({
        id: `doc-rf-${Math.random().toString(36).substring(2, 9)}`,
        fileName: "Report Format",
        fileType: "docx",
        documentType: "reportFormat",
        version: "1.0",
        uploadDate: new Date().toISOString(),
        uploadedBy: assigneeDetails.name,
      });
    }
    
    if (attachRulesAndProcedures) {
      documents.push({
        id: `doc-rp-${Math.random().toString(36).substring(2, 9)}`,
        fileName: "Rules and Procedures",
        fileType: "pdf",
        documentType: "rulesAndProcedures",
        version: "1.0",
        uploadDate: new Date().toISOString(),
        uploadedBy: assigneeDetails.name,
      });
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
      assigneeDetails,
      documents: documents.length > 0 ? documents : undefined
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
        
        <Separator className="my-2" />
        
        <div>
          <h3 className="text-sm font-medium mb-3">Required Documents</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="attachSOP"
                checked={attachSOP}
                onChange={(e) => setAttachSOP(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="attachSOP" className="text-sm flex items-center">
                <FileText className="h-4 w-4 text-green-500 mr-2" />
                Standard Operating Procedure
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="attachDataFormat"
                checked={attachDataFormat}
                onChange={(e) => setAttachDataFormat(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="attachDataFormat" className="text-sm flex items-center">
                <Database className="h-4 w-4 text-blue-500 mr-2" />
                Data Recording Format
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="attachReportFormat"
                checked={attachReportFormat}
                onChange={(e) => setAttachReportFormat(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="attachReportFormat" className="text-sm flex items-center">
                <PieChart className="h-4 w-4 text-amber-500 mr-2" />
                Report Format
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="attachRulesAndProcedures"
                checked={attachRulesAndProcedures}
                onChange={(e) => setAttachRulesAndProcedures(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="attachRulesAndProcedures" className="text-sm flex items-center">
                <BookOpen className="h-4 w-4 text-purple-500 mr-2" />
                Rules and Procedures
              </label>
            </div>
          </div>
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
