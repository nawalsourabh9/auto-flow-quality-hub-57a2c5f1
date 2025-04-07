
import { TaskDocument } from "@/components/dashboard/TaskList";

export interface Task {
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
}
