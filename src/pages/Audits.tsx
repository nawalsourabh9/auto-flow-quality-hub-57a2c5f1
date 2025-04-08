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
import { Audit } from "@/types/task";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Audit title must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  auditType: z.enum(['internal', 'external', 'supplier', 'customer', 'regulatory']),
  department: z.string().min(2, {
    message: "Department must be at least 2 characters.",
  }),
  auditor: z.string().min(2, {
    message: "Auditor name must be at least 2 characters.",
  }),
  scheduledDate: z.string(),
  status: z.enum(['scheduled', 'in-progress', 'completed', 'postponed', 'cancelled']),
});

const Audits = () => {
  const [audits, setAudits] = useState<Audit[]>([
    {
      id: "1",
      title: "Internal Audit - Production Line 1",
      description: "Comprehensive audit of production line 1 for compliance with ISO 9001 standards",
      auditType: "internal",
      department: "Production",
      auditor: "John Smith",
      scheduledDate: "2025-04-15",
      status: "scheduled",
      createdAt: "2025-03-20"
    },
    {
      id: "2",
      title: "Supplier Audit - Vendor ABC",
      description: "Quality audit of supplier ABC's manufacturing processes and quality control systems",
      auditType: "supplier",
      department: "Quality",
      auditor: "Sarah Johnson",
      scheduledDate: "2025-05-01",
      status: "in-progress",
      createdAt: "2025-04-01"
    },
    {
      id: "3",
      title: "Customer Audit - Customer XYZ",
      description: "Audit of customer XYZ's facilities and processes to ensure compliance with quality requirements",
      auditType: "customer",
      department: "Sales",
      auditor: "Robert Chen",
      scheduledDate: "2025-04-22",
      status: "completed",
      createdAt: "2025-03-15",
      completedAt: "2025-04-22"
    }
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [auditTypeFilter, setAuditTypeFilter] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const currentUser = "John Doe";

  const filteredAudits = audits.filter(audit => {
    const matchesSearch =
      audit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || audit.status === statusFilter;
    const matchesAuditType = !auditTypeFilter || audit.auditType === auditTypeFilter;

    return matchesSearch && matchesStatus && matchesAuditType;
  });

  const handleViewAudit = (audit: Audit) => {
    console.log("View audit:", audit);
    toast({
      title: "Audit Selected",
      description: `Viewing audit: ${audit.title}`
    });
  };

  const handleAddAudit = (data: z.infer<typeof formSchema>) => {
    const generateId = () => Math.random().toString(36).substring(2, 15);

    const newAudit: Audit = {
      id: generateId(),
      title: data.title,
      description: data.description,
      auditType: data.auditType,
      department: data.department,
      auditor: data.auditor,
      scheduledDate: data.scheduledDate,
      status: data.status,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setAudits([...audits, newAudit]);
    setIsAddDialogOpen(false);
    toast({
      title: "Audit Created",
      description: `Successfully created audit: ${data.title}`
    });
  };

  const handleEditAudit = (audit: Audit) => {
    setSelectedAudit(audit);
    setIsEditDialogOpen(true);
  };

  const handleUpdateAudit = (data: z.infer<typeof formSchema>) => {
    if (!selectedAudit) return;

    const updatedAudits = audits.map(audit => {
      if (audit.id === selectedAudit.id) {
        return {
          ...audit,
          title: data.title,
          description: data.description,
          auditType: data.auditType,
          department: data.department,
          auditor: data.auditor,
          scheduledDate: data.scheduledDate,
          status: data.status
        };
      }
      return audit;
    });

    setAudits(updatedAudits);
    setIsEditDialogOpen(false);
    setSelectedAudit(null);
    toast({
      title: "Audit Updated",
      description: `Successfully updated audit: ${data.title}`
    });
  };

  const handleDeleteAudit = (auditId: string) => {
    setAudits(audits.filter(audit => audit.id !== auditId));
    toast({
      title: "Audit Deleted",
      description: `Successfully deleted audit`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audits</h1>
          <p className="text-muted-foreground">Manage and track all your audits</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
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
                  <th className="px-4 py-3 text-left text-sm font-medium">Audit</th>
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
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{audit.title}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {audit.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{audit.auditType}</td>
                      <td className="px-4 py-3 text-sm">{audit.department}</td>
                      <td className="px-4 py-3 text-sm">{audit.auditor}</td>
                      <td className="px-4 py-3 text-sm">{audit.scheduledDate}</td>
                      <td className="px-4 py-3 text-sm">{audit.status}</td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" onClick={() => handleViewAudit(audit)}>
                          View
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleEditAudit(audit)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteAudit(audit.id)}>
                          Delete
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

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Create Audit</DialogTitle>
            <DialogDescription>Add a new audit to the system.</DialogDescription>
          </DialogHeader>
          <AuditForm onSubmit={handleAddAudit} />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Audit</DialogTitle>
            <DialogDescription>Edit the selected audit.</DialogDescription>
          </DialogHeader>
          <AuditForm onSubmit={handleUpdateAudit} initialData={selectedAudit} isEditing={true} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AuditForm = ({ onSubmit, initialData, isEditing = false }) => {
  const form = useForm({
    defaultValues: initialData || {
      title: "",
      description: "",
      auditType: "internal",
      department: "",
      auditor: "",
      scheduledDate: "",
      status: "scheduled"
    },
    resolver: zodResolver(formSchema)
  });

  // Fix typescript issue with auditType state
  const [auditType, setAuditType] = useState<"internal" | "external" | "supplier" | "customer" | "regulatory">(
    (initialData?.auditType as "internal" | "external" | "supplier" | "customer" | "regulatory") || "internal"
  );

  // Fix typescript issue with status state
  const [status, setStatus] = useState<"scheduled" | "in-progress" | "completed" | "postponed" | "cancelled">(
    (initialData?.status as "scheduled" | "in-progress" | "completed" | "postponed" | "cancelled") || "scheduled"
  );

  // Update the onChange handlers
  const handleAuditTypeChange = (value: string) => {
    setAuditType(value as "internal" | "external" | "supplier" | "customer" | "regulatory");
    form.setValue("auditType", value);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value as "scheduled" | "in-progress" | "completed" | "postponed" | "cancelled");
    form.setValue("status", value);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Audit Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter audit title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Enter audit description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="auditType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Audit Type</FormLabel>
              <Select
                value={field.value}
                onValueChange={handleAuditTypeChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audit type" />
                  </SelectTrigger>
                </FormControl>
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
          )}
        />

        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter department" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="auditor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Auditor</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter auditor name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scheduledDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scheduled Date</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                value={field.value}
                onValueChange={handleStatusChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
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
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button
            type="submit"
            className={cn('mt-4', isEditing && 'bg-amber-600 hover:bg-amber-700')}
          >
            {isEditing ? "Update Audit" : "Create Audit"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default Audits;
