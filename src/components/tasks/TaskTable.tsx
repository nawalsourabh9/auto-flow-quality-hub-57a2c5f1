import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Clock, AlertCircle, Paperclip, FileText, Database, PieChart } from "lucide-react";
import { TaskDocument } from "@/components/dashboard/TaskList";
import { Task } from "@/types/task";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DocumentViewer from "@/components/tasks/DocumentViewer";

interface TasksTableProps {
  tasks: Task[];
  onViewTask: (task: Task) => void;
}

const TasksTable: React.FC<TasksTableProps> = ({ tasks, onViewTask }) => {
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

  const getDocumentBadges = (documents?: TaskDocument[]) => {
    if (!documents || documents.length === 0) return null;
    
    const documentTypes = {
      sop: documents.find(doc => doc.documentType === 'sop'),
      dataFormat: documents.find(doc => doc.documentType === 'dataFormat'),
      reportFormat: documents.find(doc => doc.documentType === 'reportFormat')
    };

    return (
      <div className="flex flex-wrap gap-1">
        {documentTypes.sop && (
          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 flex items-center gap-1">
            <FileText className="h-3 w-3" /> SOP
          </Badge>
        )}
        {documentTypes.dataFormat && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1">
            <Database className="h-3 w-3" /> Data
          </Badge>
        )}
        {documentTypes.reportFormat && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center gap-1">
            <PieChart className="h-3 w-3" /> Report
          </Badge>
        )}
      </div>
    );
  };

  return (
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
                  <tr key={task.id} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{task.title}</p>
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
                        {getDocumentBadges(task.documents)}
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
  );
};

export default TasksTable;
