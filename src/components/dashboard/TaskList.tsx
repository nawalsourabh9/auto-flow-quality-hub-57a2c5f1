import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ApprovalHierarchy } from "@/types/document";

export interface DocumentRevision {
  id: string;
  fileName: string;
  version: string;
  uploadDate: string;
  uploadedBy: string;
  fileSize: string;
  fileUrl?: string;
  notes?: string;
}

export interface TaskDocument {
  documentType: 'sop' | 'dataFormat' | 'reportFormat' | 'rulesAndProcedures';
  revisions: DocumentRevision[];
  currentRevisionId: string;
  approvalHierarchy?: ApprovalHierarchy;
}

interface TaskListProps {
  tasks: {
    id: string;
    title: string;
    description: string;
    department: string;
    assignee: string;
    priority: 'low' | 'medium' | 'high';
    dueDate: string;
    status: 'completed' | 'in-progress' | 'overdue' | 'not-started';
    createdAt: string;
    isRecurring: boolean;
    recurringFrequency?: string;
    attachmentsRequired: 'none' | 'optional' | 'required';
    assigneeDetails?: {
      name: string;
      avatar?: string;
      initials: string;
      department: string;
      position: string;
    };
    attachments?: {
      id: string;
      name: string;
      fileType: string;
      uploadedBy: string;
      uploadDate: string;
      fileSize: string;
    }[];
    documents?: TaskDocument[];
  }[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.map((task) => (
          <div key={task.id} className="mb-4 p-4 border rounded-md">
            <h3 className="text-lg font-semibold">{task.title}</h3>
            <p className="text-sm text-gray-500">{task.description}</p>
            <div className="mt-2">
              <Badge className="mr-2">{task.department}</Badge>
              <Badge className="mr-2">{task.priority}</Badge>
              <Badge>{task.status}</Badge>
            </div>
            {task.assigneeDetails && (
              <div className="mt-2 flex items-center">
                <Avatar className="mr-2 h-8 w-8">
                  <AvatarFallback>{task.assigneeDetails.initials}</AvatarFallback>
                  {task.assigneeDetails.avatar && (
                    <AvatarImage src={task.assigneeDetails.avatar} alt={task.assigneeDetails.name} />
                  )}
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{task.assigneeDetails.name}</p>
                  <p className="text-xs text-gray-500">{task.assigneeDetails.position}</p>
                </div>
              </div>
            )}
            {task.documents && task.documents.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-semibold">Documents</h4>
                <ul>
                  {task.documents.map((doc) => (
                    <li key={doc.currentRevisionId} className="flex items-center justify-between py-2 border-b">
                      <span>{doc.documentType}</span>
                      <span>Version: {doc.revisions.find(rev => rev.id === doc.currentRevisionId)?.version || 'N/A'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TaskList;
