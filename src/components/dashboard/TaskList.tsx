
import { CheckCircle, Clock, AlertCircle, Paperclip, FileText, Database, PieChart, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface DocumentRevision {
  id: string;
  fileName: string;
  version: string;
  uploadDate: string;
  uploadedBy: string;
  fileSize: string;
  fileUrl?: string;
}

export interface TaskDocument {
  documentType: 'sop' | 'dataFormat' | 'reportFormat';
  revisions: DocumentRevision[];
  currentRevisionId?: string;
}

interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'completed' | 'in-progress' | 'overdue';
  assignee: {
    name: string;
    avatar?: string;
    initials: string;
  };
  attachmentsRequired?: 'required' | 'optional' | 'none';
  documents?: TaskDocument[];
  isCustomerRelated?: boolean;
  customerName?: string;
}

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100">Medium</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100">High</Badge>;
    }
  };

  const getAttachmentBadge = (attachmentsRequired?: Task['attachmentsRequired']) => {
    switch (attachmentsRequired) {
      case 'required':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100 flex items-center gap-1">
          <Paperclip className="h-3 w-3" /> Required
        </Badge>;
      case 'optional':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1">
          <Paperclip className="h-3 w-3" /> Optional
        </Badge>;
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

  const getDocumentBadges = (documents?: TaskDocument[]) => {
    if (!documents || documents.length === 0) return null;
    
    const documentTypes = {
      sop: documents.find(doc => doc.documentType === 'sop'),
      dataFormat: documents.find(doc => doc.documentType === 'dataFormat'),
      reportFormat: documents.find(doc => doc.documentType === 'reportFormat')
    };

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {documentTypes.sop && (
          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 flex items-center gap-1">
            <FileText className="h-3 w-3" /> SOP
          </Badge>
        )}
        {documentTypes.dataFormat && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1">
            <Database className="h-3 w-3" /> Data Format
          </Badge>
        )}
        {documentTypes.reportFormat && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center gap-1">
            <PieChart className="h-3 w-3" /> Report Format
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Tasks</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {tasks.map((task) => (
            <li key={task.id} className={`flex items-center justify-between p-4 hover:bg-muted/30 cursor-pointer ${task.isCustomerRelated ? 'bg-green-50/50' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="pt-1">{getStatusIcon(task.status)}</div>
                <div>
                  <h3 className="font-medium">{task.title}</h3>
                  <div className="flex items-center flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                    <span>Due: {task.dueDate}</span>
                    {getPriorityBadge(task.priority)}
                    {getAttachmentBadge(task.attachmentsRequired)}
                    {getCustomerBadge(task.isCustomerRelated, task.customerName)}
                    {getDocumentBadges(task.documents)}
                  </div>
                </div>
              </div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
                <AvatarFallback className="bg-gray-200 text-gray-700">{task.assignee.initials}</AvatarFallback>
              </Avatar>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
