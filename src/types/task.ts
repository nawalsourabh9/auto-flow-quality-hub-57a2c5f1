
import { TaskDocument } from "@/types/document";

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
  isCustomerRelated?: boolean; // Added field for customer tasks
  customerName?: string; // Optional customer name
  recurringFrequency?: string;
  startDate?: string; // Added field for recurring task start date
  endDate?: string; // Added field for recurring task end date
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
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  departmentHeadId?: string;
  comments?: string; // Added field for status comments
}

// Team member interface for organization management
export type TeamMember = {
  id: string;  
  name: string;
  email: string;
  position: string;
  department: string;  // Changed to string to match department IDs
  initials: string;
  phone?: string;
  supervisorId?: string | null;
};

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

// Non-Conformance interface for managing quality issues
export interface NonConformance {
  id: string;
  title: string;
  description: string;
  department: string;
  severity: 'critical' | 'major' | 'minor';
  reportedBy: string;
  reportedDate: string;
  status: 'open' | 'under-review' | 'corrective-action' | 'closed' | 'rejected';
  affectedProduct?: string;
  customerImpact: boolean;
  rootCause?: string;
  containmentActions?: string;
  correctiveActions?: string;
  closedDate?: string;
  assignedTo: string;
  dueDate: string;
  isCustomerRelated: boolean;
}

// Department role permissions for tasks and documents
export interface DepartmentRolePermissions {
  departmentId: string;
  departmentHeadId: string;
  requiresApproval: boolean;
  canReassign: boolean;
  autoNotify: boolean;
}
