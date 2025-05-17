
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
    
    const updatedTask: Task = {
      ...task,
      status,
      documents: task.documents || [] // Preserve existing documents
    };

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
