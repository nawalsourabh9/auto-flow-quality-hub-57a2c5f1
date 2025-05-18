
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Task } from "@/types/task";
import { TaskDocument } from "@/types/document";
import TaskTableRow from "./table/TaskTableRow";
import DeleteTaskDialog from "./table/DeleteTaskDialog";
import DocumentViewerDialog from "./table/DocumentViewerDialog";

interface TasksTableProps {
  tasks: Task[];
  onViewTask: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => Promise<boolean>;
  isAdmin?: boolean;
  currentUserId?: string;
  currentUserPermissions?: any; // Simplified - accept any permissions
  teamMembers?: Array<{
    id: string;
    name: string;
    position: string;
    initials: string;
  }>;
}

const TasksTable: React.FC<TasksTableProps> = ({ 
  tasks, 
  onViewTask,
  onEditTask,
  onDeleteTask,
  isAdmin = true, // Default to admin for all users
  currentUserId = "1", 
  currentUserPermissions,
  teamMembers = []
}) => {
  const [viewingDocument, setViewingDocument] = useState<{
    task: Task,
    document: TaskDocument
  } | null>(null);
  
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  console.log("TasksTable isAdmin:", isAdmin);

  const handleDeleteTask = async () => {
    if (taskToDelete && onDeleteTask) {
      setIsDeleting(true);
      const success = await onDeleteTask(taskToDelete);
      setIsDeleting(false);
      if (success) {
        setTaskToDelete(null);
      }
    }
  };

  const handleUpdateRevision = (task: Task, documentType: string, revisionId: string) => {
    if (!task.documents) return;

    const docIndex = task.documents.findIndex(doc => doc.documentType === documentType);
    if (docIndex >= 0) {
      task.documents[docIndex].currentRevisionId = revisionId;
    }
  };
  
  const handleUpdateApprovalStatus = (
    task: Task, 
    documentType: string, 
    action: 'initiate' | 'check' | 'approve' | 'reject', 
    reason?: string
  ) => {
    if (!task.documents) return;
    
    const docIndex = task.documents.findIndex(doc => doc.documentType === documentType);
    if (docIndex >= 0) {
      const doc = task.documents[docIndex];
      const now = new Date().toISOString();
      
      if (!doc.approvalHierarchy) {
        doc.approvalHierarchy = {
          initiator: currentUserId,
          status: 'draft'
        };
      }
      
      switch(action) {
        case 'initiate':
          doc.approvalHierarchy.initiatorApproved = true;
          doc.approvalHierarchy.status = 'pending-checker';
          doc.approvalHierarchy.initiatedAt = now;
          break;
        case 'check':
          doc.approvalHierarchy.checkerApproved = true;
          doc.approvalHierarchy.status = 'pending-approval';
          doc.approvalHierarchy.checkedAt = now;
          break;
        case 'approve':
          doc.approvalHierarchy.approverApproved = true;
          doc.approvalHierarchy.status = 'approved';
          doc.approvalHierarchy.approvedAt = now;
          break;
        case 'reject':
          doc.approvalHierarchy.status = 'rejected';
          doc.approvalHierarchy.rejectedAt = now;
          doc.approvalHierarchy.rejectedBy = currentUserId;
          doc.approvalHierarchy.rejectionReason = reason;
          break;
      }
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="border-r">Task</TableHead>
                  <TableHead className="border-r">Assignee</TableHead>
                  <TableHead className="border-r">Department</TableHead>
                  <TableHead className="border-r">Due Date</TableHead>
                  <TableHead className="border-r">Priority</TableHead>
                  <TableHead className="border-r">Status</TableHead>
                  <TableHead className="border-r">Documents</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No tasks found
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => (
                    <TaskTableRow 
                      key={task.id}
                      task={task}
                      onViewTask={onViewTask}
                      onEditTask={onEditTask}
                      onDeleteTask={onDeleteTask ? (taskId) => setTaskToDelete(taskId) : undefined}
                      isAdmin={isAdmin}
                      setViewingDocument={setViewingDocument}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DocumentViewerDialog 
        viewingDocument={viewingDocument}
        onClose={() => setViewingDocument(null)}
        currentUserId={currentUserId}
        teamMembers={teamMembers}
        onUpdateRevision={(documentType, revisionId) => 
          viewingDocument && handleUpdateRevision(viewingDocument.task, documentType, revisionId)
        }
        onUpdateApprovalStatus={(action, reason) => 
          viewingDocument && handleUpdateApprovalStatus(
            viewingDocument.task, 
            viewingDocument.document.documentType, 
            action, 
            reason
          )
        }
      />

      <DeleteTaskDialog 
        taskId={taskToDelete}
        isDeleting={isDeleting}
        onClose={() => setTaskToDelete(null)}
        onConfirmDelete={handleDeleteTask}
      />
    </>
  );
};

export default TasksTable;
