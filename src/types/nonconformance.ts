
export interface NonConformance {
  id: string;
  title: string;
  status: "open" | "closed" | "under-review" | "corrective-action" | "rejected";
  description: string;
  department: string;
  severity: "minor" | "major" | "critical";
  reportedBy: string;
  reportedDate: string;
  assignedTo: string;
  dueDate: string;
  isCustomerRelated: boolean;
  customerName?: string;
  affectedProduct?: string;
  customerImpact: boolean;
  rootCause?: string;
  containmentActions?: string;
  correctiveActions?: string;
  closedDate?: string;
  attachments?: {
    id: string;
    name: string;
    fileType: string;
    uploadedBy: string;
    uploadDate: string;
    fileSize: string;
  }[];
}
