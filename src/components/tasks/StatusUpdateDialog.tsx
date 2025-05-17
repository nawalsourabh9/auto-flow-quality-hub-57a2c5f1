
import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Task } from "@/types/task";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentSelector } from "./form/DocumentSelector";
import { useDocumentUploads } from "./form/useDocumentUploads";
import { TaskDocument } from "@/types/document";

interface StatusUpdateDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (task: Task) => void;
}

const StatusUpdateDialog: React.FC<StatusUpdateDialogProps> = ({ 
  task, 
  isOpen, 
  onClose, 
  onUpdateTask 
}) => {
  const [status, setStatus] = useState<"not-started" | "in-progress" | "completed" | "overdue">(
    task?.status || "not-started"
  );
  
  const { 
    documentUploads, 
    handleDocumentSelect, 
    handleFileUpload 
  } = useDocumentUploads(task?.documents);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    
    // Process document uploads
    const updatedDocuments: TaskDocument[] = [];
    
    // Convert document uploads to the correct format for TaskDocument[]
    if (documentUploads.sop.selected) {
      const file = documentUploads.sop.file;
      if (file) {
        updatedDocuments.push({
          id: `temp-${Date.now()}-sop`,
          fileName: file.name,
          fileType: file.type,
          version: "1.0",
          documentType: "sop",
          uploadDate: new Date().toISOString(),
          uploadedBy: "current-user", // This will be replaced on the server
          file
        });
      }
    }
    
    if (documentUploads.dataFormat.selected) {
      const file = documentUploads.dataFormat.file;
      if (file) {
        updatedDocuments.push({
          id: `temp-${Date.now()}-dataFormat`,
          fileName: file.name,
          fileType: file.type,
          version: "1.0",
          documentType: "dataFormat",
          uploadDate: new Date().toISOString(),
          uploadedBy: "current-user", // This will be replaced on the server
          file
        });
      }
    }
    
    if (documentUploads.reportFormat.selected) {
      const file = documentUploads.reportFormat.file;
      if (file) {
        updatedDocuments.push({
          id: `temp-${Date.now()}-reportFormat`,
          fileName: file.name,
          fileType: file.type,
          version: "1.0",
          documentType: "reportFormat",
          uploadDate: new Date().toISOString(),
          uploadedBy: "current-user", // This will be replaced on the server
          file
        });
      }
    }
    
    if (documentUploads.rulesAndProcedures.selected) {
      const file = documentUploads.rulesAndProcedures.file;
      if (file) {
        updatedDocuments.push({
          id: `temp-${Date.now()}-rulesAndProcedures`,
          fileName: file.name,
          fileType: file.type,
          version: "1.0",
          documentType: "rulesAndProcedures",
          uploadDate: new Date().toISOString(),
          uploadedBy: "current-user", // This will be replaced on the server
          file
        });
      }
    }
    
    // Create an updated task with the new status and documents
    const updatedTask: Task = {
      ...task,
      status,
      documents: updatedDocuments.length > 0 ? 
        [...updatedDocuments, ...(task.documents || [])] : 
        (task.documents || [])
    };

    // Send the updated task to the parent component
    onUpdateTask(updatedTask);
    onClose();
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Task Status</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Task Status</Label>
            <Select value={status} onValueChange={(value: "not-started" | "in-progress" | "completed" | "overdue") => setStatus(value)}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not-started">Not Started</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Upload Documents</Label>
            <DocumentSelector
              documentUploads={documentUploads}
              onDocumentSelect={handleDocumentSelect}
              onFileUpload={handleFileUpload}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Update Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StatusUpdateDialog;
