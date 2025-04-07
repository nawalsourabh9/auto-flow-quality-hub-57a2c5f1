
import { CheckCircle2, AlertTriangle, ClipboardList, FileCheck, Gauge, BarChart2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { TaskList } from "@/components/dashboard/TaskList";
import { QualityMetricsChart } from "@/components/dashboard/QualityMetricsChart";
import { DocumentsStatus } from "@/components/dashboard/DocumentsStatus";

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
  },
];

const Index = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your IATF compliant E-QMS platform</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Tasks Due" 
          value={8} 
          description="3 overdue" 
          icon={ClipboardList} 
          variant="warning"
          trend={{ value: 15, positive: false }}
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

      <div className="grid gap-6 md:grid-cols-6">
        <div className="md:col-span-4">
          <QualityMetricsChart />
        </div>
        <div className="md:col-span-2">
          <DocumentsStatus />
        </div>
      </div>

      <div>
        <TaskList tasks={tasks} />
      </div>
    </div>
  );
};

export default Index;
