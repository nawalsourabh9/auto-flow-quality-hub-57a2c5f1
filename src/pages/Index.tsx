import { CheckCircle2, AlertTriangle, ClipboardList, FileCheck, Gauge, BarChart2, CalendarCheck, UserCheck } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import TaskList from "@/components/dashboard/TaskList";
import { QualityMetricsChart } from "@/components/dashboard/QualityMetricsChart";
import { DocumentsStatus } from "@/components/dashboard/DocumentsStatus";
import { NotificationDemo } from "@/components/notifications/NotificationDemo";
// Removed DashboardReportActions import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Sample tasks data
const tasks = [
  {
    id: "1",
    title: "Review Process Flow Diagram for Assembly Line 3",
    dueDate: "Today",
    priority: "high" as const,
    status: "in-progress" as const,
    assignee: {
      name: "John Doe",
      initials: "JD",
    },
  },
  {
    id: "2",
    title: "Update Control Plan for New Component X725",
    dueDate: "Apr 10, 2025",
    priority: "medium" as const,
    status: "in-progress" as const,
    assignee: {
      name: "Sarah Miller",
      initials: "SM",
    },
  },
  {
    id: "3",
    title: "PPAP Documentation for Supplier ABC",
    dueDate: "Apr 05, 2025",
    priority: "high" as const,
    status: "overdue" as const,
    assignee: {
      name: "Robert Johnson",
      initials: "RJ",
    },
  },
  {
    id: "4",
    title: "Internal Audit - Calibration Process",
    dueDate: "Apr 15, 2025",
    priority: "medium" as const,
    status: "completed" as const,
    assignee: {
      name: "Lisa Wang",
      initials: "LW",
    },
  },
  {
    id: "5",
    title: "Risk Assessment Update for Production Line 2",
    dueDate: "Apr 12, 2025",
    priority: "low" as const,
    status: "in-progress" as const,
    assignee: {
      name: "Mike Brown",
      initials: "MB",
    },
    isCustomerRelated: true,
    customerName: "Acme Corp"
  },
];

// Sample upcoming audits
const upcomingAudits = [
  {
    id: "a1",
    title: "Annual ISO 9001:2015 Internal Audit",
    scheduledDate: "2025-04-20",
    auditType: "internal" as const,
    department: "Quality",
    auditor: "Jane Smith"
  },
  {
    id: "a2",
    title: "Supplier Quality Assessment - Acme Electronics",
    scheduledDate: "2025-04-15",
    auditType: "supplier" as const,
    department: "Quality",
    auditor: "Robert Johnson"
  },
  {
    id: "a3",
    title: "IATF 16949 Surveillance Audit",
    scheduledDate: "2025-05-10",
    auditType: "external" as const,
    department: "Quality",
    auditor: "External - SGS Certification"
  }
];

const getAuditTypeColor = (type: string): string => {
  switch (type) {
    case "internal": return "bg-purple-100 text-purple-800";
    case "external": return "bg-amber-100 text-amber-800";
    case "supplier": return "bg-blue-100 text-blue-800";
    case "customer": return "bg-green-100 text-green-800";
    case "regulatory": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const Index = () => {
  // Count customer-related tasks
  const customerTasksCount = tasks.filter(task => task.isCustomerRelated).length;
  const customerTasksUrgent = tasks.filter(task => 
    task.isCustomerRelated && (task.status === "overdue" || task.priority === "high")
  ).length;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your IATF compliant E-QMS platform</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard 
          title="Tasks Due" 
          value={8} 
          description="3 overdue" 
          icon={ClipboardList} 
          variant="warning"
          trend={{ value: 15, positive: false }}
        />
        <StatCard 
          title="Customer Tasks" 
          value={customerTasksCount} 
          description={`${customerTasksUrgent} urgent`} 
          icon={UserCheck} 
          variant="primary"
          trend={{ value: 10, positive: true }}
        />
        <StatCard 
          title="Non-Conformances" 
          value={5} 
          description="This month" 
          icon={AlertTriangle} 
          variant="danger"
          trend={{ value: 20, positive: true }}
        />
        <StatCard 
          title="Audits Completed" 
          value={3} 
          description="2 pending" 
          icon={CheckCircle2} 
          variant="success"
        />
        <StatCard 
          title="KPI Achievement" 
          value="92%" 
          description="Target: 95%" 
          icon={Gauge} 
          variant="default"
          trend={{ value: 5, positive: true }}
        />
      </div>

      <NotificationDemo />

      <div className="grid gap-6 md:grid-cols-6">
        <div className="md:col-span-4">
          <QualityMetricsChart />
        </div>
        <div className="md:col-span-2">
          <div className="space-y-6">
            <DocumentsStatus />
            {/* Removed DashboardReportActions component */}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-6">
        <div className="md:col-span-4">
          <TaskList tasks={tasks} />
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <CalendarCheck className="h-5 w-5 mr-2 text-purple-600" />
                Upcoming Audits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAudits.map((audit) => (
                  <div key={audit.id} className="border-b pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm">{audit.title}</h3>
                      <Badge className={getAuditTypeColor(audit.auditType)} variant="outline">
                        {audit.auditType.charAt(0).toUpperCase() + audit.auditType.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{audit.department}</span>
                      <span>{audit.scheduledDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
