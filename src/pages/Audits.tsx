import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon, PlusIcon, CalendarIcon, CheckSquare, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Audit } from "@/types/audit";

const auditFormSchema = z.object({
  title: z.string().min(3, { message: "Audit title must be at least 3 characters." }),
  description: z.string().min(5, { message: "Description must be at least 5 characters." }),
  auditType: z.enum(["internal", "external", "supplier", "customer", "regulatory"], { 
    message: "Please select a valid audit type." 
  }),
  department: z.string().min(1, { message: "Please select a department." }),
  auditor: z.string().min(1, { message: "Please enter the auditor name." }),
  scheduledDate: z.string().min(1, { message: "Scheduled date is required." }),
  status: z.enum(["scheduled", "in-progress", "completed", "postponed", "cancelled"], { 
    message: "Please select a status." 
  }).default("scheduled"),
});

type AuditFormValues = z.infer<typeof auditFormSchema>;

const departmentOptions = ["Quality", "Production", "Engineering", "HR", "Finance", "IT", "Sales", "Marketing"];

// Sample audit data
const initialAudits: Audit[] = [
  {
    id: "audit-1",
    title: "ISO 9001:2015 Internal Audit - Quality Management System",
    description: "Comprehensive review of the QMS against ISO 9001:2015 requirements",
    auditType: "internal" as const,
    department: "Quality",
    auditor: "Jane Wilson",
    scheduledDate: "2025-04-15",
    status: "scheduled" as const,
    createdAt: "2025-03-10"
  },
  {
    id: "audit-2",
    title: "Supplier Quality Assessment - ABC Electronics",
    description: "On-site audit of supplier manufacturing processes and quality controls",
    auditType: "supplier" as const,
    department: "Purchasing",
    auditor: "Robert Johnson",
    scheduledDate: "2025-04-20",
    status: "scheduled" as const,
    createdAt: "2025-03-12"
  }
];

const getAuditTypeColor = (type: Audit["auditType"]): string => {
  switch (type) {
    case "internal": return "bg-purple-100 hover:bg-purple-200 text-purple-800";
    case "external": return "bg-amber-100 hover:bg-amber-200 text-amber-800";
    case "supplier": return "bg-blue-100 hover:bg-blue-200 text-blue-800";
    case "customer": return "bg-green-100 hover:bg-green-200 text-green-800";
    case "regulatory": return "bg-red-100 hover:bg-red-200 text-red-800";
  }
};

const getAuditStatusColor = (status: Audit["status"]): string => {
  switch (status) {
    case "scheduled": return "bg-blue-100 text-blue-800";
    case "in-progress": return "bg-amber-100 text-amber-800";
    case "completed": return "bg-green-100 text-green-800";
    case "postponed": return "bg-purple-100 text-purple-800";
    case "cancelled": return "bg-red-100 text-red-800";
  }
};

const Audits = () => {
  const [audits, setAudits] = useState<Audit[]>(initialAudits);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDepartment, setFilteredDepartment] = useState<string | null>(null);

  const form = useForm<AuditFormValues>({
    resolver: zodResolver(auditFormSchema),
    defaultValues: {
      title: "",
      description: "",
      auditType: "internal",
      department: "",
      auditor: "",
      scheduledDate: "",
      status: "scheduled"
    }
  });

  const handleAddAudit = (data: AuditFormValues) => {
    const newAudit: Audit = {
      id: `audit-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString()
    };
    
    setAudits([...audits, newAudit]);
    setIsAddDialogOpen(false);
    form.reset();
    
    toast({
      title: "Audit Created",
      description: "The audit has been scheduled successfully."
    });
  };

  const filterAudits = () => {
    return audits.filter(audit => {
      const matchesSearch = 
        audit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audit.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audit.auditor.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = !filteredDepartment || audit.department === filteredDepartment;
      
      const matchesTab = selectedTab === "all" || selectedTab === audit.status;
      
      return matchesSearch && matchesDepartment && matchesTab;
    });
  };

  const filteredAudits = filterAudits();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Management</h1>
        <p className="text-muted-foreground">Plan, execute and track internal and external audits</p>
      </div>
      
      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="grid grid-cols-5 w-[600px]">
            <TabsTrigger value="all">All Audits</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="postponed">Postponed</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search audits..." 
                className="pl-8 h-9 w-[200px] rounded-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filteredDepartment || "all"} onValueChange={(value) => setFilteredDepartment(value === "all" ? null : value)}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departmentOptions.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Schedule Audit
            </Button>
          </div>
        </div>
        
        <TabsContent value="all" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredAudits.length > 0 ? filteredAudits.map(audit => (
              <Card key={audit.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between">
                    <CardTitle className="text-lg">{audit.title}</CardTitle>
                    <Badge className={getAuditStatusColor(audit.status)}>
                      {audit.status.charAt(0).toUpperCase() + audit.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{audit.description}</p>
                    
                    <div className="flex justify-between text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Badge className={getAuditTypeColor(audit.auditType)} variant="outline">
                            {audit.auditType.charAt(0).toUpperCase() + audit.auditType.slice(1)} Audit
                          </Badge>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <span className="truncate">{audit.department} Department</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center justify-end">
                          <CalendarIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>{audit.scheduledDate}</span>
                        </div>
                        <div className="text-muted-foreground">
                          Auditor: {audit.auditor}
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2 flex justify-end gap-2">
                      <Button variant="outline" size="sm">View Details</Button>
                      {audit.status === "scheduled" && (
                        <Button variant="default" size="sm" className="bg-purple-600 hover:bg-purple-700">
                          Start Audit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card className="col-span-2 p-6">
                <div className="h-40 flex flex-col items-center justify-center">
                  <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No audits found matching your criteria.</p>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="scheduled" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredAudits.length > 0 ? filteredAudits.map(audit => (
              <Card key={audit.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between">
                    <CardTitle className="text-lg">{audit.title}</CardTitle>
                    <Badge className={getAuditStatusColor(audit.status)}>
                      {audit.status.charAt(0).toUpperCase() + audit.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{audit.description}</p>
                    
                    <div className="flex justify-between text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Badge className={getAuditTypeColor(audit.auditType)} variant="outline">
                            {audit.auditType.charAt(0).toUpperCase() + audit.auditType.slice(1)} Audit
                          </Badge>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <span className="truncate">{audit.department} Department</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center justify-end">
                          <CalendarIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>{audit.scheduledDate}</span>
                        </div>
                        <div className="text-muted-foreground">
                          Auditor: {audit.auditor}
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2 flex justify-end gap-2">
                      <Button variant="outline" size="sm">View Details</Button>
                      {audit.status === "scheduled" && (
                        <Button variant="default" size="sm" className="bg-purple-600 hover:bg-purple-700">
                          Start Audit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card className="col-span-2 p-6">
                <div className="h-40 flex flex-col items-center justify-center">
                  <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No scheduled audits found.</p>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="in-progress" className="mt-4">
          <Card className="p-6">
            <div className="h-40 flex flex-col items-center justify-center">
              <CheckSquare className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No audits currently in progress.</p>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed" className="mt-4">
          <Card className="p-6">
            <div className="h-40 flex flex-col items-center justify-center">
              <CheckSquare className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No completed audits yet.</p>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="postponed" className="mt-4">
          <Card className="p-6">
            <div className="h-40 flex flex-col items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No postponed audits.</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Audit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Schedule New Audit</DialogTitle>
            <DialogDescription>
              Enter the details to schedule an internal or external audit.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddAudit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audit Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter audit title" {...field} />
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
                        placeholder="Enter audit description"
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
                  name="auditType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audit Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="auditor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auditor</FormLabel>
                      <FormControl>
                        <Input placeholder="Auditor name/organization" {...field} />
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
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Schedule Audit</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Audits;
