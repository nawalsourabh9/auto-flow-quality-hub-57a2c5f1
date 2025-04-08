
export interface Audit {
  id: string;
  title: string;
  status: "completed" | "in-progress" | "scheduled" | "postponed" | "cancelled";
  description: string;
  department: string;
  auditType: "internal" | "supplier" | "external" | "customer" | "regulatory";
  auditor: string;
  scheduledDate: string;
  createdAt: string;
}
