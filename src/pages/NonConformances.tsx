import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, FileText, Database, PieChart, FileUp, History, CheckCircle, User, BookOpen, AlertTriangle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { AuditFinding, NonConformance } from "@/types/task";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  department: z.string().min(2, {
    message: "Department must be at least 2 characters.",
  }),
  severity: z.enum(['critical', 'major', 'minor']),
  reportedBy: z.string().min(2, {
    message: "Reported by must be at least 2 characters.",
  }),
  reportedDate: z.string(),
  status: z.enum(['open', 'under-review', 'corrective-action', 'closed', 'rejected']),
  affectedProduct: z.string().optional(),
  customerImpact: z.boolean().default(false),
  rootCause: z.string().optional(),
  containmentActions: z.string().optional(),
  correctiveActions: z.string().optional(),
  assignedTo: z.string().min(2, {
    message: "Assigned to must be at least 2 characters.",
  }),
  dueDate: z.string(),
  isCustomerRelated: z.boolean().default(false),
});

// Add/update the function component to ensure all required properties are present
const NonConformances = () => {
  const [nonConformances, setNonConformances] = useState<NonConformance[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState("John Doe");

  useEffect(() => {
    // Load non-conformances from local storage on component mount
    const storedNonConformances = localStorage.getItem('nonConformances');
    if (storedNonConformances) {
      setNonConformances(JSON.parse(storedNonConformances));
    }
  }, []);

  useEffect(() => {
    // Save non-conformances to local storage whenever the state changes
    localStorage.setItem('nonConformances', JSON.stringify(nonConformances));
  }, [nonConformances]);

  // Ensure the sample data has all required properties
  const sampleNonConformances = [
    {
      id: "1",
      title: "Incorrect Product Labeling",
      description: "Product labels showing incorrect expiration dates",
      department: "Production",
      severity: "major" as "major",
      reportedBy: "John Smith",
      reportedDate: "2025-03-15",
      status: "open" as "open",
      affectedProduct: "ABC-123",
      customerImpact: true,
      rootCause: "",
      containmentActions: "Segregated affected batch",
      correctiveActions: "",
      assignedTo: "Mary Johnson",
      dueDate: "2025-04-15",
      isCustomerRelated: true
    },
    {
      id: "2",
      title: "Process Parameter Deviation",
      description: "Temperature exceeded upper control limit during production",
      department: "Engineering",
      severity: "minor" as "minor",
      reportedBy: "Robert Chen",
      reportedDate: "2025-04-01",
      status: "open" as "open",
      customerImpact: false,
      assignedTo: "Sarah Williams",
      dueDate: "2025-04-10",
      isCustomerRelated: false
    }
  ];

  useEffect(() => {
    setNonConformances(sampleNonConformances);
  }, []);

  const filteredNonConformances = nonConformances.filter(nonConformance => {
    const matchesSearch =
      nonConformance.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nonConformance.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || nonConformance.status === statusFilter;
    const matchesSeverity = !severityFilter || nonConformance.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const generateId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleAddNonConformance = (data: any) => {
    // Ensure all required fields are present when creating a new non-conformance
    const newNonConformance = {
      id: generateId(),
      title: data.title,
      description: data.description,
      department: data.department,
      severity: data.severity,
      reportedBy: data.reportedBy || currentUser,
      reportedDate: data.reportedDate || new Date().toISOString().split('T')[0],
      status: data.status || 'open',
      assignedTo: data.assignedTo,
      dueDate: data.dueDate,
      isCustomerRelated: data.isCustomerRelated || false,
      customerImpact: data.customerImpact || false,
      // Add other fields as needed
      affectedProduct: data.affectedProduct || "",
      rootCause: data.rootCause || "",
      containmentActions: data.containmentActions || "",
      correctiveActions: data.correctiveActions || ""
    };

    setNonConformances([...nonConformances, newNonConformance]);
    setIsAddDialogOpen(false);
  };

  const severityColorMap = {
    critical: "bg-red-500 text-white",
    major: "bg-orange-500 text-white",
    minor: "bg-yellow-500 text-gray-800",
  };

  const getSeverityBadge = (severity: 'critical' | 'major' | 'minor') => {
    const className = severityColorMap[severity] || "bg-gray-400 text-white";
    return (
      <Badge className={className}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  return (
    // Make sure you're using setIsAddDialogOpen instead of setIsDialogOpen
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Non-Conformances</h1>
          <p className="text-muted-foreground">Manage and track all non-conformances</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Add Non-Conformance
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search non-conformances..."
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
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="under-review">Under Review</SelectItem>
            <SelectItem value="corrective-action">Corrective Action</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter || ""} onValueChange={(value) => setSeverityFilter(value || null)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="major">Major</SelectItem>
            <SelectItem value="minor">Minor</SelectItem>
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
                  <th className="px-4 py-3 text-left text-sm font-medium">Department</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Severity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Reported By</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Reported Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNonConformances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                      No non-conformances found
                    </td>
                  </tr>
                ) : (
                  filteredNonConformances.map((nonConformance) => (
                    <tr key={nonConformance.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{nonConformance.title}</div>
                        <div className="text-sm text-muted-foreground">{nonConformance.description}</div>
                      </td>
                      <td className="px-4 py-3">{nonConformance.department}</td>
                      <td className="px-4 py-3">{getSeverityBadge(nonConformance.severity)}</td>
                      <td className="px-4 py-3">{nonConformance.reportedBy}</td>
                      <td className="px-4 py-3">{nonConformance.reportedDate}</td>
                      <td className="px-4 py-3">{nonConformance.status}</td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline">
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

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Add Non-Conformance</DialogTitle>
            <DialogDescription>
              Create a new non-conformance to track quality issues.
            </DialogDescription>
          </DialogHeader>
          <NonConformanceForm onSubmit={handleAddNonConformance} />
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NonConformances;

interface NonConformanceFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
}

const NonConformanceForm: React.FC<NonConformanceFormProps> = ({ onSubmit }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      department: "",
      severity: "minor",
      reportedBy: "",
      reportedDate: new Date().toISOString().split('T')[0],
      status: "open",
      affectedProduct: "",
      customerImpact: false,
      rootCause: "",
      containmentActions: "",
      correctiveActions: "",
      assignedTo: "",
      dueDate: new Date().toISOString().split('T')[0],
      isCustomerRelated: false,
    },
  });

  function onSubmitForm(values: z.infer<typeof formSchema>) {
    onSubmit(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Title" {...field} />
                </FormControl>
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
                  <Input placeholder="Department" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="severity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Severity</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a severity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="minor">Minor</SelectItem>
                  </SelectContent>
                </Select>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="under-review">Under Review</SelectItem>
                    <SelectItem value="corrective-action">Corrective Action</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="reportedBy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reported By</FormLabel>
                <FormControl>
                  <Input placeholder="Reported By" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reportedDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reported Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned To</FormLabel>
                <FormControl>
                  <Input placeholder="Assigned To" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="affectedProduct"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Affected Product (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Affected Product" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isCustomerRelated"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Customer Related?</FormLabel>
                  <FormDescription>
                    Is this non-conformance related to a customer?
                  </FormDescription>
                </div>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="rootCause"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Root Cause (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Root Cause"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="containmentActions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Containment Actions (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Containment Actions"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="correctiveActions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Corrective Actions (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Corrective Actions"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};
