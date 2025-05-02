
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Clock, AlertCircle, Paperclip, FileText, Database, PieChart, User, ExternalLink, BookOpen } from "lucide-react";
import { TaskDocument } from "@/types/document";
import { Task } from "@/types/task";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DocumentViewer from "@/components/tasks/DocumentViewer";
import { Link } from "react-router-dom";
import { DocumentPermissions } from "@/types/document";

interface TasksTableProps {
  tasks: Task[];
  onViewTask: (task: Task) => void;
  currentUserId?: string;
  currentUserPermissions?: DocumentPermissions;
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
  currentUserId = "1", // Default to John Doe for demo
  currentUserPermissions,
  teamMembers = []
}) => {
  const [viewingDocument, setViewingDocument] = useState<{
    task: Task,
    document: TaskDocument
  } | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 flex items-center gap-1"><Clock className="h-3 w-3" /> In Progress</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="bg-red-50 text-red-700 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Overdue</Badge>;
      case 'not-started':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 flex items-center gap-1">Not Started</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700">Medium</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-red-50 text-red-700">High</Badge>;
    }
  };

  const getAttachmentBadge = (attachmentsRequired: 'none' | 'optional' | 'required') => {
    switch (attachmentsRequired) {
      case 'required':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 flex items-center gap-1"><Paperclip className="h-3 w-3" /> Required</Badge>;
      case 'optional':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 flex items-center gap-1"><Paperclip className="h-3 w-3" /> Optional</Badge>;
      default:
        return null;
    }
  };

  const getCustomerBadge = (isCustomerRelated?: boolean, customerName?: string) => {
    if (!isCustomerRelated) return null;
    
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 flex items-center gap-1">
        <User className="h-3 w-3" /> {customerName || 'Customer'}
      </Badge>
    );
  };

  const getDocumentBadges = (task: Task) => {
    if (!task.documents || task.documents.length === 0) return null;
    
    const documentTypes = {
      sop: task.documents.find(doc => doc.documentType === 'sop'),
      dataFormat: task.documents.find(doc => doc.documentType === 'dataFormat'),
      reportFormat: task.documents.find(doc => doc.documentType === 'reportFormat'),
      rulesAndProcedures: task.documents.find(doc => doc.documentType === 'rulesAndProcedures')
    };

    return (
      <div className="flex flex-wrap gap-1">
        {documentTypes.sop && (
          <Badge 
            variant="outline" 
            className={`${
              documentTypes.sop.approvalHierarchy?.status === 'approved' ? 'bg-green-50 text-green-700' : 
              documentTypes.sop.approvalHierarchy?.status === 'rejected' ? 'bg-red-50 text-red-700' : 
              'bg-amber-50 text-amber-700'
            } hover:bg-green-100 flex items-center gap-1 cursor-pointer`}
            onClick={(e) => {
              e.stopPropagation();
              setViewingDocument({ task, document: documentTypes.sop! });
            }}
          >
            <FileText className="h-3 w-3" /> SOP
            {documentTypes.sop.approvalHierarchy?.status === 'approved' && <CheckCircle className="h-2 w-2 ml-1" />}
          </Badge>
        )}
        {documentTypes.dataFormat && (
          <Badge 
            variant="outline" 
            className={`${
              documentTypes.dataFormat.approvalHierarchy?.status === 'approved' ? 'bg-green-50 text-green-700' : 
              documentTypes.dataFormat.approvalHierarchy?.status === 'rejected' ? 'bg-red-50 text-red-700' : 
              'bg-blue-50 text-blue-700'
            } hover:bg-blue-100 flex items-center gap-1 cursor-pointer`}
            onClick={(e) => {
              e.stopPropagation();
              setViewingDocument({ task, document: documentTypes.dataFormat! });
            }}
          >
            <Database className="h-3 w-3" /> Data
            {documentTypes.dataFormat.approvalHierarchy?.status === 'approved' && <CheckCircle className="h-2 w-2 ml-1" />}
          </Badge>
        )}
        {documentTypes.reportFormat && (
          <Badge 
            variant="outline" 
            className={`${
              documentTypes.reportFormat.approvalHierarchy?.status === 'approved' ? 'bg-green-50 text-green-700' : 
              documentTypes.reportFormat.approvalHierarchy?.status === 'rejected' ? 'bg-red-50 text-red-700' : 
              'bg-amber-50 text-amber-700'
            } hover:bg-amber-100 flex items-center gap-1 cursor-pointer`}
            onClick={(e) => {
              e.stopPropagation();
              setViewingDocument({ task, document: documentTypes.reportFormat! });
            }}
          >
            <PieChart className="h-3 w-3" /> Report
            {documentTypes.reportFormat.approvalHierarchy?.status === 'approved' && <CheckCircle className="h-2 w-2 ml-1" />}
          </Badge>
        )}
        {documentTypes.rulesAndProcedures && (
          <Badge 
            variant="outline" 
            className={`${
              documentTypes.rulesAndProcedures.approvalHierarchy?.status === 'approved' ? 'bg-green-50 text-green-700' : 
              documentTypes.rulesAndProcedures.approvalHierarchy?.status === 'rejected' ? 'bg-red-50 text-red-700' : 
              'bg-purple-50 text-purple-700'
            } hover:bg-purple-100 flex items-center gap-1 cursor-pointer`}
            onClick={(e) => {
              e.stopPropagation();
              setViewingDocument({ task, document: documentTypes.rulesAndProcedures! });
            }}
          >
            <BookOpen className="h-3 w-3" /> R&P
            {documentTypes.rulesAndProcedures.approvalHierarchy?.status === 'approved' && <CheckCircle className="h-2 w-2 ml-1" />}
          </Badge>
        )}
      </div>
    );
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
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium border-r last:border-r-0">Task</th>
                  <th className="px-4 py-3 text-left text-sm font-medium border-r last:border-r-0">Assignee</th>
                  <th className="px-4 py-3 text-left text-sm font-medium border-r last:border-r-0">Due Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium border-r last:border-r-0">Priority</th>
                  <th className="px-4 py-3 text-left text-sm font-medium border-r last:border-r-0">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium border-r last:border-r-0">Documents</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground border-b">
                      No tasks found
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.id} className={`border-b hover:bg-muted/50 ${task.isCustomerRelated ? 'bg-green-50/50' : ''}`}>
                      <td className="px-4 py-3 border-r">
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {task.title}
                            {task.isCustomerRelated && getCustomerBadge(task.isCustomerRelated, task.customerName)}
                          </p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {task.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={task.assigneeDetails?.avatar} />
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {task.assigneeDetails?.initials || "??"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{task.assigneeDetails?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm border-r">{task.dueDate}</td>
                      <td className="px-4 py-3 border-r">{getPriorityBadge(task.priority)}</td>
                      <td className="px-4 py-3 border-r">{getStatusBadge(task.status)}</td>
                      <td className="px-4 py-3 border-r">
                        <div className="flex flex-wrap gap-1">
                          {getAttachmentBadge(task.attachmentsRequired)}
                          {getDocumentBadges(task)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" onClick={() => onViewTask(task)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
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
                  handleUpdateRevision(viewingDocument.task, documentType, revisionId)
                }
                currentUserId={currentUserId}
                currentUserPermissions={currentUserPermissions}
                teamMembers={teamMembers}
                onUpdateApprovalStatus={(action, reason) => 
                  handleUpdateApprovalStatus(viewingDocument.task, viewingDocument.document.documentType, action, reason)
                }
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
    </>
  );
};

export default TasksTable;
