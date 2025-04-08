
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

export interface ApprovalHierarchy {
  initiator: string;
  checker?: string;
  approver?: string;
  initiatorApproved?: boolean;
  checkerApproved?: boolean;
  approverApproved?: boolean;
  status: 'draft' | 'pending-checker' | 'pending-approval' | 'approved' | 'rejected';
  initiatedAt?: string;
  checkedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  allowedDepartments: string[];
  requiredApprovalLevels: ('initiator' | 'checker' | 'approver')[];
}

// Permission levels for users
export interface DocumentPermissions {
  canInitiate: boolean;
  canCheck: boolean;
  canApprove: boolean;
  allowedDocumentTypes: string[];
  allowedDepartments: string[];
}

// Update TaskDocument interface to include the new document type
export interface TaskDocument {
  documentType: 'sop' | 'dataFormat' | 'reportFormat' | 'rulesAndProcedures';
  revisions: DocumentRevision[];
  currentRevisionId: string;
  approvalHierarchy?: ApprovalHierarchy;
}
