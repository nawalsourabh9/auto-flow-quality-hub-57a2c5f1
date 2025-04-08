
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, FileText, Database, PieChart, FileUp, History, CheckCircle, User, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { DocumentRevision, TaskDocument, ApprovalHierarchy } from "@/types/document";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSearchParams } from "react-router-dom";
import TasksTable from "@/components/tasks/TaskTable";
import StatusBadge from "@/components/tasks/StatusBadge";
import PriorityBadge from "@/components/tasks/PriorityBadge";
import { Task } from "@/types/task";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import DocumentUploadDialog from "@/components/documents/DocumentUploadDialog";
import { useQuery } from "@tanstack/react-query";

// Sample task data
const sampleTasks: Task[] = [
  {
    id: "1",
    title: "Review Process Flow Diagram for Assembly Line 3",
    description: "Analyze and update the process flow for improved efficiency",
    department: "Engineering",
    assignee: "JD",
    priority: "high",
    dueDate: "2025-04-15",
    status: "in-progress",
    createdAt: "2025-04-01",
    isRecurring: false,
    attachmentsRequired: "required",
    assigneeDetails: {
      name: "John Doe",
      initials: "JD",
      department: "Engineering",
      position: "Process Engineer"
    }
  },
  {
    id: "2",
    title: "Quality Audit - Supplier ABC",
    description: "Conduct quality audit for new supplier components",
    department: "Quality",
    assignee: "SM",
    priority: "medium",
    dueDate: "2025-04-20",
    status: "not-started",
    createdAt: "2025-04-02",
    isRecurring: false,
    attachmentsRequired: "optional",
    assigneeDetails: {
      name: "Sarah Miller",
      initials: "SM",
      department: "Quality",
      position: "Quality Specialist"
    }
  },
  {
    id: "3",
    title: "Update Customer Complaint Documentation",
    description: "Review and update the customer complaint handling procedure",
    department: "Quality",
    assignee: "RJ",
    priority: "high",
    dueDate: "2025-04-08",
    status: "overdue",
    createdAt: "2025-03-25",
    isRecurring: false,
    isCustomerRelated: true,
    customerName: "XYZ Industries",
    attachmentsRequired: "required",
    assigneeDetails: {
      name: "Robert Johnson",
      initials: "RJ",
      department: "Quality",
      position: "Quality Manager"
    }
  }
];

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage and track all your quality tasks</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> New Task
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tasks..." 
            className="pl-8" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter || ""} onValueChange={(value) => setStatusFilter(value || null)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="not-started">Not Started</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter || ""} onValueChange={(value) => setPriorityFilter(value || null)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TasksTable tasks={filteredTasks} />
    </div>
  );
};

export default Tasks;
