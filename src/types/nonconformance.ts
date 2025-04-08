
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
}
