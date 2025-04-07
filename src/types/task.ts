
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

// Team member interface for organization management
export interface TeamMember {
  id: number;
  name: string;
  email: string;
  position: string;
  department: number;
  avatar?: string;
  initials: string;
}

// Audit interface for audit management
export interface Audit {
  id: string;
  title: string;
  description: string;
  auditType: 'internal' | 'external' | 'supplier' | 'customer' | 'regulatory';
  department: string;
  auditor: string;
  scheduledDate: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'postponed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  findings?: AuditFinding[];
}

export interface AuditFinding {
  id: string;
  description: string;
  severity: 'critical' | 'major' | 'minor' | 'observation';
  status: 'open' | 'in-progress' | 'closed';
  assignedTo?: string;
  dueDate?: string;
  createdAt: string;
  closedAt?: string;
}
