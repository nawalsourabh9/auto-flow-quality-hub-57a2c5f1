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
import { Audit } from "@/types/task";

// Sample data for demonstration
const sampleAudits: Audit[] = [
  {
    id: "audit-1",
    title: "Internal Audit - Production Line 1",
    description: "Review of production processes and documentation",
    auditType: "internal",
    department: "Production",
    auditor: "JD",
    scheduledDate: "2025-05-01",
    status: "scheduled",
    createdAt: "2025-04-15"
  },
  {
    id: "audit-2",
    title: "Supplier Audit - Component Supplier XYZ",
    description: "Assessment of supplier's quality management system",
    auditType: "supplier",
    department: "Quality",
    auditor: "SM",
    scheduledDate: "2025-05-15",
    status: "in-progress",
    createdAt: "2025-04-20"
  },
  {
    id: "audit-3",
    title: "Regulatory Compliance Audit - Environmental Standards",
    description: "Verification of compliance with environmental regulations",
    auditType: "regulatory",
    department: "HSE",
    auditor: "RJ",
    scheduledDate: "2025-05-22",
    status: "completed",
    createdAt: "2025-04-25",
    completedAt: "2025-05-22"
  }
];

const Audits = () => {
  const [audits, setAudits] = useState<Audit[]>(sampleAudits);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [auditTypeFilter, setAuditTypeFilter] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAudit, setEditingAudit] = useState<Audit | null>(null);

  // Dummy user data for demonstration
  const currentUser = {
    id: "1",
    name: "John Doe",
    department: "Quality"
  };

  const filteredAudits = audits.filter(audit => {
    const matchesSearch =
      audit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || audit.status === statusFilter;
    const matchesAuditType = !auditTypeFilter || audit.auditType === auditTypeFilter;

    return matchesSearch && matchesStatus && matchesAuditType;
  });

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    setEditingAudit(null);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAudit(null);
  };

  const handleEditAudit = (audit: Audit) => {
    setEditingAudit(audit);
    setIsDialogOpen(true);
  };
  
  // Function to create or update audit
  const handleCreateOrUpdateAudit = (data: Partial<Audit>) => {
    if (editingAudit) {
      // Update existing
      setAudits(prev => 
        prev.map(audit => audit.id === editingAudit.id ? { ...audit, ...data } : audit)
      );
      toast({
        title: "Audit Updated",
        description: "Audit has been successfully updated."
      });
    } else {
      // Create new - ensure all required fields are included
      const newAudit: Audit = {
        id: `audit-${Date.now()}`,
        title: data.title || "New Audit", // Make sure title is not optional
        description: data.description || "", 
        auditType: data.auditType || "internal",
        department: data.department || "Quality",
        auditor: data.auditor || currentUser.id,
        scheduledDate: data.scheduledDate || new Date().toISOString(),
        status: data.status || "scheduled",
        createdAt: data.createdAt || new Date().toISOString()
      };
      
      setAudits(prev => [newAudit, ...prev]);
      toast({
        title: "Audit Created",
        description: "New audit has been successfully created."
      });
    }
    
    setIsDialogOpen(false);
    setEditingAudit(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audits</h1>
          <p className="text-muted-foreground">Manage and track all your audits</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-1 h-4 w-4" /> New Audit
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search audits..."
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
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="postponed">Postponed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={auditTypeFilter || ""} onValueChange={(value) => setAuditTypeFilter(value || null)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Audit Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="internal">Internal</SelectItem>
            <SelectItem value="external">External</SelectItem>
            <SelectItem value="supplier">Supplier</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="regulatory">Regulatory</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Department</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Auditor</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Scheduled Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAudits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                      No audits found
                    </td>
                  </tr>
                ) : (
                  filteredAudits.map((audit) => (
                    <tr key={audit.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">{audit.title}</td>
                      <td className="px-4 py-3">{audit.auditType}</td>
                      <td className="px-4 py-3">{audit.department}</td>
                      <td className="px-4 py-3">{audit.auditor}</td>
                      <td className="px-4 py-3">{audit.scheduledDate}</td>
                      <td className="px-4 py-3">{audit.status}</td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" onClick={() => handleEditAudit(audit)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingAudit ? "Edit Audit" : "Create New Audit"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <AuditForm
              audit={editingAudit}
              onSubmit={handleCreateOrUpdateAudit}
              onCancel={handleCloseDialog}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface AuditFormProps {
  audit?: Audit;
  onSubmit: (data: Partial<Audit>) => void;
  onCancel: () => void;
}

const AuditForm: React.FC<AuditFormProps> = ({ audit, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(audit?.title || "");
  const [description, setDescription] = useState(audit?.description || "");
  const [auditType, setAuditType] = useState(audit?.auditType || "internal");
  const [department, setDepartment] = useState(audit?.department || "Quality");
  const [auditor, setAuditor] = useState(audit?.auditor || "JD");
  const [scheduledDate, setScheduledDate] = useState(audit?.scheduledDate || new Date().toISOString());
  const [status, setStatus] = useState(audit?.status || "scheduled");

  const handleSubmit = () => {
    onSubmit({
      title,
      description,
      auditType,
      department,
      auditor,
      scheduledDate,
      status
    });
  };

  return (
    <div className="grid gap-4">
      <FormField>
        <FormItem>
          <FormLabel>Title</FormLabel>
          <FormControl>
            <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField>
        <FormItem>
          <FormLabel>Description</FormLabel>
          <FormControl>
            <Input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField>
        <FormItem>
          <FormLabel>Audit Type</FormLabel>
          <Select value={auditType} onValueChange={setAuditType}>
            <SelectTrigger>
              <SelectValue placeholder="Select audit type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="external">External</SelectItem>
              <SelectItem value="supplier">Supplier</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="regulatory">Regulatory</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField>
        <FormItem>
          <FormLabel>Department</FormLabel>
          <FormControl>
            <Input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField>
        <FormItem>
          <FormLabel>Auditor</FormLabel>
          <FormControl>
            <Input type="text" value={auditor} onChange={(e) => setAuditor(e.target.value)} />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField>
        <FormItem>
          <FormLabel>Scheduled Date</FormLabel>
          <FormControl>
            <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField>
        <FormItem>
          <FormLabel>Status</FormLabel>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="postponed">Postponed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      </FormField>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          {audit ? "Update Audit" : "Create Audit"}
        </Button>
      </div>
    </div>
  );
};

export default Audits;
