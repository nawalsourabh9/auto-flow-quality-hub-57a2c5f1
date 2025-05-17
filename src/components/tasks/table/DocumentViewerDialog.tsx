
import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DocumentViewer from "@/components/tasks/DocumentViewer";
import { Task } from "@/types/task";
import { TaskDocument, DocumentPermissions } from "@/types/document";

interface DocumentViewerDialogProps {
  viewingDocument: { task: Task, document: TaskDocument } | null;
  onClose: () => void;
  currentUserId?: string;
  currentUserPermissions?: DocumentPermissions;
  teamMembers?: Array<{
    id: string;
    name: string;
    position: string;
    initials: string;
  }>;
  onUpdateRevision: (documentType: string, revisionId: string) => void;
  onUpdateApprovalStatus: (action: 'initiate' | 'check' | 'approve' | 'reject', reason?: string) => void;
}

const DocumentViewerDialog: React.FC<DocumentViewerDialogProps> = ({
  viewingDocument,
  onClose,
  currentUserId,
  currentUserPermissions,
  teamMembers,
  onUpdateRevision,
  onUpdateApprovalStatus
}) => {
  return (
    <Dialog open={!!viewingDocument} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Document Viewer</DialogTitle>
        </DialogHeader>
        {viewingDocument && (
          <div className="space-y-4">
            <DocumentViewer 
              task={viewingDocument.task} 
              document={viewingDocument.document} 
              onUpdateRevision={(documentType, revisionId) => 
                onUpdateRevision(documentType, revisionId)
              }
              currentUserId={currentUserId}
              currentUserPermissions={currentUserPermissions}
              teamMembers={teamMembers}
              onUpdateApprovalStatus={onUpdateApprovalStatus}
            />
            
            <div className="flex justify-end border-t pt-4">
              <Link to="/documents" className="flex items-center gap-1 text-sm text-blue-600">
                View in Documents <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewerDialog;
