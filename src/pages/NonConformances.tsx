import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Plus, 
  AlertTriangle, 
  AlertCircle,
  FileX 
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { NonConformance } from "@/types/nonconformance";
import { toast } from "@/hooks/use-toast";

const nonConformanceFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().min(5, { message: "Description is required." }),
  department: z.string().min(1, { message: "Please select a department." }),
  severity: z.enum(["critical", "major", "minor"], { message: "Please select severity." }),
  affectedProduct: z.string().optional(),
  customerImpact: z.boolean().default(false),
  status: z.enum(["open", "under-review", "corrective-action", "closed", "rejected"]).default("open"),
  assignedTo: z.string().optional(),
  rootCause: z.string().optional(),
  containmentActions: z.string().optional(),
  correctiveActions: z.string().optional(),
});

const initialNonConformances: NonConformance[] = [
  {
    id: "NC001",
    title: "Dimensional Variation in Part #A123",
    description: "Parts exceed tolerance limits by 0.5mm on critical dimension",
    department: "Production",
    severity: "major",
    reportedBy: "John Doe",
    reportedDate: "2025-04-02",
    status: "open",
    affectedProduct: "Assembly Line A Products",
    customerImpact: true,
    assignedTo: "Emily Davis"
  },
  {
    id: "NC002",
    title: "Missing Documentation for Batch #B456",
    description: "Quality records incomplete for production batch #B456",
    department: "Quality",
    severity: "minor",
    reportedBy: "Jane Smith",
    reportedDate: "2025-04-05",
    status: "under-review",
    customerImpact: false,
    assignedTo: "Robert Johnson"
  },
  {
    id: "NC003",
    title: "Packaging Damage on Shipment #S789",
    description: "Multiple units received with damaged packaging from supplier",
    department: "Logistics",
    severity: "minor",
    reportedBy: "Michael Brown",
    reportedDate: "2025-04-06",
    status: "corrective-action",
    customerImpact: false,
    assignedTo: "John Doe"
  },
  {
    id: "NC004",
    title: "Critical Safety Feature Failure",
    description: "Safety interlock mechanism failed during testing of unit #U234",
    department: "Engineering",
    severity: "critical",
    reportedBy: "Emily Davis",
    reportedDate: "2025-04-01",
    status: "open",
    affectedProduct: "Safety Controller X-5000",
    customerImpact: true,
    assignedTo: "Robert Johnson"
  }
];

const departmentOptions = ["Quality", "Production", "Engineering", "HR", "Finance", "IT", "Sales", "Marketing", "Logistics"];

const employeesData = [
  { id: "1", name: "John Doe", department: "Quality", position: "Quality Manager", initials: "JD" },
  { id: "2", name: "Jane Smith", department: "Production", position: "Production Lead", initials: "JS" },
  { id: "3", name: "Robert Johnson", department: "Engineering", position: "Design Engineer", initials: "RJ" },
  { id: "4", name: "Emily Davis", department: "Quality", position: "Quality Analyst", initials: "ED" },
  { id: "5", name: "Michael Brown", department: "Logistics", position: "Logistics Manager", initials: "MB" }
];

const NonConformances = () => {
  const [nonConformances, setNonConformances] = useState<NonConformance[]>(initialNonConformances);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedNC, setSelectedNC] = useState<NonConformance | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof nonConformanceFormSchema>>({
    resolver: zodResolver(nonConformanceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      department: "",
      severity: "minor",
      affectedProduct: "",
      customerImpact: false,
      status: "open",
      assignedTo: "",
      rootCause: "",
      containmentActions: "",
      correctiveActions: "",
    }
  });

  const handleAddNC = (data: z.infer<typeof nonConformanceFormSchema>) => {
    const assignedPerson = employeesData.find(emp => emp.id === data.assignedTo);
    
    const newNC: NonConformance = {
      id: `NC${(nonConformances.length + 1).toString().padStart(3, '0')}`,
      ...data,
      reportedBy: "Current User",
      reportedDate: new Date().toISOString().split('T')[0],
      assignedTo: assignedPerson?.name
    };
    
    setNonConformances([...nonConformances, newNC]);
    setIsAddDialogOpen(false);
    form.reset();
    
    toast({
      title: "Non-Conformance Created",
      description: "The non-conformance has been recorded and assigned."
    });
  };
  
  const handleViewNC = (nc: NonConformance) => {
    setSelectedNC(nc);
    setIsViewDialogOpen(true);
  };
  
  const getSeverityBadge = (severity: NonConformance['severity']) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Critical</Badge>;
      case 'major':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700">Major</Badge>;
      case 'minor':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Minor</Badge>;
    }
  };
  
  const getStatusBadge = (status: NonConformance['status']) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Open</Badge>;
      case 'under-review':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Under Review</Badge>;
      case 'corrective-action':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700">Corrective Action</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Closed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">Rejected</Badge>;
    }
  };
  
  const filteredNCs = nonConformances.filter(nc => {
    const matchesSearch = 
      nc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (nc.affectedProduct && nc.affectedProduct.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (nc.assignedTo && nc.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || nc.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getSeverityIcon = (severity: NonConformance['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'major':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'minor':
        return <FileX className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Non-Conformance</h1>
        <p className="text-muted-foreground">Track and manage non-conformances and corrective actions</p>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Non-Conformance Records</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search records..." 
                className="pl-8 h-9 w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="under-review">Under Review</SelectItem>
                <SelectItem value="corrective-action">Corrective Action</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => setIsAddDialogOpen(true)} 
              className="bg-primary hover:bg-primary/90"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Record
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported Date</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Customer Impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNCs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                    No non-conformance records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredNCs.map((nc) => (
                  <TableRow key={nc.id} onClick={() => handleViewNC(nc)} className="cursor-pointer">
                    <TableCell className="font-medium">{nc.id}</TableCell>
                    <TableCell>{nc.title}</TableCell>
                    <TableCell>{nc.department}</TableCell>
                    <TableCell>{getSeverityBadge(nc.severity)}</TableCell>
                    <TableCell>{getStatusBadge(nc.status)}</TableCell>
                    <TableCell>{nc.reportedDate}</TableCell>
                    <TableCell>{nc.assignedTo || '—'}</TableCell>
                    <TableCell>
                      {nc.customerImpact ? 
                        <Badge variant="outline" className="bg-red-50 text-red-700">Yes</Badge> : 
                        <Badge variant="outline" className="bg-gray-50 text-gray-700">No</Badge>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Add Non-Conformance Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Non-Conformance Record</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddNC)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter non-conformance title" {...field} />
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
                      <textarea 
                        className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        placeholder="Describe the non-conformance"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departmentOptions.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select severity" />
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
              </div>
              
              <FormField
                control={form.control}
                name="affectedProduct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Affected Product/Process</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter affected product or process" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select person responsible" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employeesData.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} - {emp.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customerImpact"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-1">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Customer Impact
                      </FormLabel>
                      <FormDescription>
                        Check if this non-conformance could impact customers
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="containmentActions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Containment Actions</FormLabel>
                      <FormControl>
                        <textarea 
                          className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          placeholder="Describe any immediate containment actions"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Create Record</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* View Non-Conformance Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedNC && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>{selectedNC.id}: {selectedNC.title}</span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-4 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(selectedNC.severity)}
                    {getSeverityBadge(selectedNC.severity)}
                  </div>
                  {getStatusBadge(selectedNC.status)}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium">Description</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedNC.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">Department</h3>
                    <p className="mt-1 text-sm">{selectedNC.department}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Affected Product</h3>
                    <p className="mt-1 text-sm">{selectedNC.affectedProduct || '—'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">Reported By</h3>
                    <p className="mt-1 text-sm">{selectedNC.reportedBy}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Reported Date</h3>
                    <p className="mt-1 text-sm">{selectedNC.reportedDate}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">Assigned To</h3>
                    <p className="mt-1 text-sm">{selectedNC.assignedTo || '—'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Customer Impact</h3>
                    <div className="mt-1">
                      {selectedNC.customerImpact ? 
                        <Badge variant="outline" className="bg-red-50 text-red-700">Yes</Badge> : 
                        <Badge variant="outline" className="bg-gray-50 text-gray-700">No</Badge>}
                    </div>
                  </div>
                </div>
                
                {selectedNC.containmentActions && (
                  <div>
                    <h3 className="text-sm font-medium">Containment Actions</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedNC.containmentActions}</p>
                  </div>
                )}
                
                {selectedNC.correctiveActions && (
                  <div>
                    <h3 className="text-sm font-medium">Corrective Actions</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedNC.correctiveActions}</p>
                  </div>
                )}
                
                {selectedNC.rootCause && (
                  <div>
                    <h3 className="text-sm font-medium">Root Cause</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedNC.rootCause}</p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NonConformances;
