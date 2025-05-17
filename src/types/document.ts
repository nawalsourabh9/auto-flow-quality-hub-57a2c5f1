
export interface TaskDocument {
  id: string;
  fileName: string;
  fileType: string;
  version: string;
  documentType: 'sop' | 'dataFormat' | 'reportFormat' | 'rulesAndProcedures';
  uploadDate: string;
  uploadedBy: string;
  notes?: string;
  currentRevisionId?: string;
  approvalHierarchy?: ApprovalHierarchy;
  revisions?: DocumentRevision[];
  file?: File; // Added to support file uploads
  filePath?: string; // Added to store the path in Supabase storage
}

export interface DocumentRevision {
  id: string;
  fileName: string;  // Added to fix document viewer errors
  version: string;
  uploadDate: string;
  uploadedBy: string;
  notes?: string;
}

export interface ApprovalHierarchy {
  initiator: string;
  checker?: string;
  approver?: string;
  status: 'draft' | 'pending-checker' | 'pending-approval' | 'approved' | 'rejected';
  initiatorApproved?: boolean;
  checkerApproved?: boolean;
  approverApproved?: boolean;
  initiatedAt?: string;
  checkedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}

export interface DocumentPermissions {
  canInitiate: boolean;
  canCheck: boolean;
  canApprove: boolean;
  allowedDocumentTypes: string[];
  allowedDepartments: string[];
}

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  allowedDepartments: string[];
  requiredApprovalLevels: ('initiator' | 'checker' | 'approver')[];
}
