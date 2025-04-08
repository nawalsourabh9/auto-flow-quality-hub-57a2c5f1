
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/types/task";
import { Separator } from "@/components/ui/separator";
import { FileText, Database, PieChart, BookOpen, Upload } from "lucide-react";
import { TaskDocument } from "@/types/document";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Label } from "@/components/ui/label";

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
  
  // Document selection and upload states
  const [selectedDocuments, setSelectedDocuments] = useState<TaskDocument[]>(initialData.documents || []);
  const [documentUploads, setDocumentUploads] = useState({
    sop: { selected: false, file: null as File | null },
    dataFormat: { selected: false, file: null as File | null },
    reportFormat: { selected: false, file: null as File | null },
    rulesAndProcedures: { selected: false, file: null as File | null },
  });

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

    // Create documents based on selections and uploads
    const documents: TaskDocument[] = [];
    
    // Create placeholder documents based on selections
    if (documentUploads.sop.selected) {
      documents.push({
        id: `doc-sop-${Math.random().toString(36).substring(2, 9)}`,
        fileName: documentUploads.sop.file?.name || "Standard Operating Procedure",
        fileType: documentUploads.sop.file?.type || "pdf",
        documentType: "sop",
        version: "1.0",
        uploadDate: new Date().toISOString(),
        uploadedBy: assigneeDetails.name,
      });
    }
    
    if (documentUploads.dataFormat.selected) {
      documents.push({
        id: `doc-df-${Math.random().toString(36).substring(2, 9)}`,
        fileName: documentUploads.dataFormat.file?.name || "Data Recording Format",
        fileType: documentUploads.dataFormat.file?.type || "xlsx",
        documentType: "dataFormat",
        version: "1.0",
        uploadDate: new Date().toISOString(),
        uploadedBy: assigneeDetails.name,
      });
    }
    
    if (documentUploads.reportFormat.selected) {
      documents.push({
        id: `doc-rf-${Math.random().toString(36).substring(2, 9)}`,
        fileName: documentUploads.reportFormat.file?.name || "Report Format",
        fileType: documentUploads.reportFormat.file?.type || "docx",
        documentType: "reportFormat",
        version: "1.0",
        uploadDate: new Date().toISOString(),
        uploadedBy: assigneeDetails.name,
      });
    }
    
    if (documentUploads.rulesAndProcedures.selected) {
      documents.push({
        id: `doc-rp-${Math.random().toString(36).substring(2, 9)}`,
        fileName: documentUploads.rulesAndProcedures.file?.name || "Rules and Procedures",
        fileType: documentUploads.rulesAndProcedures.file?.type || "pdf",
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

  const handleDocumentSelect = (
    docType: "sop" | "dataFormat" | "reportFormat" | "rulesAndProcedures", 
    selected: boolean
  ) => {
    setDocumentUploads(prev => ({
      ...prev,
      [docType]: { 
        ...prev[docType], 
        selected 
      }
    }));
  };

  const handleFileUpload = (
    docType: "sop" | "dataFormat" | "reportFormat" | "rulesAndProcedures", 
    file: File | null
  ) => {
    setDocumentUploads(prev => ({
      ...prev,
      [docType]: { 
        ...prev[docType], 
        file 
      }
    }));
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
          <h3 className="text-sm font-medium mb-3">Documents</h3>
          
          <div className="space-y-4">
            {/* Standard Operating Procedure */}
            <div className="border rounded-md p-3">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox 
                  id="docSOP"
                  checked={documentUploads.sop.selected}
                  onCheckedChange={(checked) => handleDocumentSelect("sop", checked === true)}
                />
                <Label htmlFor="docSOP" className="flex items-center">
                  <FileText className="h-4 w-4 text-green-500 mr-2" />
                  Standard Operating Procedure
                </Label>
              </div>
              
              {documentUploads.sop.selected && (
                <div className="ml-6 mt-2 flex gap-2 items-center">
                  <Input 
                    type="file" 
                    id="sopFile"
                    onChange={(e) => handleFileUpload("sop", e.target.files?.[0] || null)}
                    className="flex-1 text-sm"
                  />
                  <Upload size={16} className="text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Data Recording Format */}
            <div className="border rounded-md p-3">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox 
                  id="docDataFormat"
                  checked={documentUploads.dataFormat.selected}
                  onCheckedChange={(checked) => handleDocumentSelect("dataFormat", checked === true)}
                />
                <Label htmlFor="docDataFormat" className="flex items-center">
                  <Database className="h-4 w-4 text-blue-500 mr-2" />
                  Data Recording Format
                </Label>
              </div>
              
              {documentUploads.dataFormat.selected && (
                <div className="ml-6 mt-2 flex gap-2 items-center">
                  <Input 
                    type="file" 
                    id="dataFormatFile"
                    onChange={(e) => handleFileUpload("dataFormat", e.target.files?.[0] || null)}
                    className="flex-1 text-sm"
                  />
                  <Upload size={16} className="text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Report Format */}
            <div className="border rounded-md p-3">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox 
                  id="docReportFormat"
                  checked={documentUploads.reportFormat.selected}
                  onCheckedChange={(checked) => handleDocumentSelect("reportFormat", checked === true)}
                />
                <Label htmlFor="docReportFormat" className="flex items-center">
                  <PieChart className="h-4 w-4 text-amber-500 mr-2" />
                  Report Format
                </Label>
              </div>
              
              {documentUploads.reportFormat.selected && (
                <div className="ml-6 mt-2 flex gap-2 items-center">
                  <Input 
                    type="file" 
                    id="reportFormatFile"
                    onChange={(e) => handleFileUpload("reportFormat", e.target.files?.[0] || null)}
                    className="flex-1 text-sm"
                  />
                  <Upload size={16} className="text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Rules and Procedures */}
            <div className="border rounded-md p-3">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox 
                  id="docRulesProc"
                  checked={documentUploads.rulesAndProcedures.selected}
                  onCheckedChange={(checked) => handleDocumentSelect("rulesAndProcedures", checked === true)}
                />
                <Label htmlFor="docRulesProc" className="flex items-center">
                  <BookOpen className="h-4 w-4 text-purple-500 mr-2" />
                  Rules and Procedures
                </Label>
              </div>
              
              {documentUploads.rulesAndProcedures.selected && (
                <div className="ml-6 mt-2 flex gap-2 items-center">
                  <Input 
                    type="file" 
                    id="rulesProcFile"
                    onChange={(e) => handleFileUpload("rulesAndProcedures", e.target.files?.[0] || null)}
                    className="flex-1 text-sm"
                  />
                  <Upload size={16} className="text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isCustomerRelated"
            checked={isCustomerRelated}
            onCheckedChange={(checked) => setIsCustomerRelated(checked === true)}
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
