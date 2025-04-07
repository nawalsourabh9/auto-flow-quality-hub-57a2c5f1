
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Clock, AlertCircle, Paperclip, FileText, Database, PieChart, User, ExternalLink } from "lucide-react";
import { TaskDocument } from "@/components/dashboard/TaskList";
import { Task } from "@/types/task";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import DocumentViewer from "@/components/tasks/DocumentViewer";
import { Link } from "react-router-dom";

interface TasksTableProps {
  tasks: Task[];
  onViewTask: (task: Task) => void;
}

const TasksTable: React.FC<TasksTableProps> = ({ tasks, onViewTask }) => {
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
      reportFormat: task.documents.find(doc => doc.documentType === 'reportFormat')
    };

    return (
      <div className="flex flex-wrap gap-1">
        {documentTypes.sop && (
          <Badge 
            variant="outline" 
            className="bg-green-50 text-green-700 hover:bg-green-100 flex items-center gap-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setViewingDocument({ task, document: documentTypes.sop! });
            }}
          >
            <FileText className="h-3 w-3" /> SOP
          </Badge>
        )}
        {documentTypes.dataFormat && (
          <Badge 
            variant="outline" 
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setViewingDocument({ task, document: documentTypes.dataFormat! });
            }}
          >
            <Database className="h-3 w-3" /> Data
          </Badge>
        )}
        {documentTypes.reportFormat && (
          <Badge 
            variant="outline" 
            className="bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center gap-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setViewingDocument({ task, document: documentTypes.reportFormat! });
            }}
          >
            <PieChart className="h-3 w-3" /> Report
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

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">Task</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Assignee</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Due Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Priority</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Documents</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                      No tasks found
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.id} className={`border-b hover:bg-muted/50 ${task.isCustomerRelated ? 'bg-green-50/50' : ''}`}>
                      <td className="px-4 py-3">
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
                      <td className="px-4 py-3">
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
                      <td className="px-4 py-3 text-sm">{task.dueDate}</td>
                      <td className="px-4 py-3">{getPriorityBadge(task.priority)}</td>
                      <td className="px-4 py-3">{getStatusBadge(task.status)}</td>
                      <td className="px-4 py-3">
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
