import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, FileText, Database, PieChart, FileUp, History, CheckCircle, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { DocumentRevision, TaskDocument } from "@/components/dashboard/TaskList";
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

const taskFormSchema = z.object({
  title: z.string().min(3, { message: "Task title must be at least 3 characters." }),
  description: z.string().min(5, { message: "Description must be at least 5 characters." }),
  assignType: z.enum(["department", "employee"], { message: "Please select assignment type." }),
  department: z.string().optional(),
  assignee: z.string().optional(),
  priority: z.enum(["low", "medium", "high"], { message: "Please select a priority level." }),
  dueDate: z.string().min(1, { message: "Due date is required." }),
  status: z.enum(["not-started", "in-progress", "completed", "overdue"], { 
    message: "Please select a status." 
  }).default("not-started"),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.string().optional(),
  attachmentsRequired: z.enum(["none", "optional", "required"], { 
    message: "Please select attachment requirement" 
  }).default("none"),
  isCustomerRelated: z.boolean().default(false),
  customerName: z.string().optional(),
});

const departmentsData = [
  {
    id: "quality",
    name: "Quality",
    subDepartments: [
      { id: "quality-control", name: "Quality Control" },
      { id: "quality-assurance", name: "Quality Assurance" },
      { id: "lab", name: "Laboratory" },
    ]
  },
  {
    id: "production",
    name: "Production",
    subDepartments: [
      { id: "assembly", name: "Assembly" },
      { id: "machining", name: "Machining" },
      { id: "packaging", name: "Packaging" },
    ]
  },
  {
    id: "engineering",
    name: "Engineering",
    subDepartments: [
      { id: "design", name: "Design" },
      { id: "process", name: "Process Engineering" },
      { id: "maintenance", name: "Maintenance" },
    ]
  },
  {
    id: "hr",
    name: "HR",
    subDepartments: []
  },
  {
    id: "finance",
    name: "Finance",
    subDepartments: []
  },
  {
    id: "it",
    name: "IT",
    subDepartments: []
  },
  {
    id: "sales",
    name: "Sales",
    subDepartments: []
  },
  {
    id: "marketing",
    name: "Marketing",
    subDepartments: []
  }
];

const flatDepartments = [
  ...departmentsData.map(d => ({ id: d.id, name: d.name })),
  ...departmentsData.flatMap(d => d.subDepartments)
];

const departmentOptions = flatDepartments.map(dept => dept.name);

const employeesData = [
  { id: "1", name: "John Doe", department: "quality", subDepartment: "quality-control", position: "Quality Manager", initials: "JD", avatar: "" },
  { id: "2", name: "Jane Smith", department: "production", subDepartment: "assembly", position: "Production Lead", initials: "JS", avatar: "" },
  { id: "3", name: "Robert Johnson", department: "engineering", subDepartment: "design", position: "Design Engineer", initials: "RJ", avatar: "" },
  { id: "4", name: "Emily Davis", department: "quality", subDepartment: "quality-assurance", position: "Quality Analyst", initials: "ED", avatar: "" },
  { id: "5", name: "Michael Brown", department: "it", position: "IT Support", initials: "MB", avatar: "" },
  { id: "6", name: "Sarah Wilson", department: "quality", subDepartment: "lab", position: "Lab Technician", initials: "SW", avatar: "" },
  { id: "7", name: "David Miller", department: "production", subDepartment: "machining", position: "Machine Operator", initials: "DM", avatar: "" },
  { id: "8", name: "Lisa Taylor", department: "hr", position: "HR Specialist", initials: "LT", avatar: "" },
];

const initialTasks: Task[] = [
  {
    id: "t1",
    title: "Daily Quality Check - Assembly Line A",
    description: "Perform standard quality checks on Assembly Line A products",
    department: "Quality",
    assignee: "1",
    assigneeDetails: {
      name: "John Doe",
      initials: "JD",
      department: "Quality",
      position: "Quality Manager"
    },
    priority: "high",
    dueDate: "2025-04-08",
    status: "not-started",
    createdAt: "2025-04-07",
    isRecurring: true,
    recurringFrequency: "daily",
    attachmentsRequired: "required",
    isCustomerRelated: false
  },
  {
    id: "t2",
    title: "Weekly Calibration - Measuring Tools",
    description: "Calibrate all precision measuring tools in production area",
    department: "Engineering",
    assignee: "3",
    assigneeDetails: {
      name: "Robert Johnson",
      initials: "RJ",
      department: "Engineering",
      position: "Design Engineer"
    },
    priority: "medium",
    dueDate: "2025-04-12",
    status: "not-started",
    createdAt: "2025-04-07",
    isRecurring: true,
    recurringFrequency: "weekly",
    attachmentsRequired: "optional",
    isCustomerRelated: false
  },
  {
    id: "t3",
    title: "Monthly IATF Documentation Review",
    description: "Review and update IATF compliance documentation",
    department: "Quality",
    assignee: "4",
    assigneeDetails: {
      name: "Emily Davis",
      initials: "ED",
      department: "Quality",
      position: "Quality Analyst"
    },
    priority: "medium",
    dueDate: "2025-04-30",
    status: "not-started",
    createdAt: "2025-04-07",
    isRecurring: true,
    recurringFrequency: "monthly",
    attachmentsRequired: "required",
    isCustomerRelated: false
  },
  {
    id: "t4",
    title: "Customer Complaint Resolution - ABC Corp",
    description: "Investigate and resolve customer complaint regarding product quality",
    department: "Quality",
    assignee: "1",
    assigneeDetails: {
      name: "John Doe",
      initials: "JD",
      department: "Quality",
      position: "Quality Manager"
    },
    priority: "high",
    dueDate: "2025-04-10",
    status: "in-progress",
    createdAt: "2025-04-06",
    isRecurring: false,
    attachmentsRequired: "required",
    isCustomerRelated: true,
    customerName: "ABC Corporation"
  },
  {
    id: "t5",
    title: "Customer Spec Review - XYZ Industries",
    description: "Review new customer specifications for upcoming project",
    department: "Engineering",
    assignee: "3",
    assigneeDetails: {
      name: "Robert Johnson",
      initials: "RJ",
      department: "Engineering",
      position: "Design Engineer"
    },
    priority: "high",
    dueDate: "2025-04-15",
    status: "not-started",
    createdAt: "2025-04-07",
    isRecurring: false,
    attachmentsRequired: "optional",
    isCustomerRelated: true,
    customerName: "XYZ Industries"
  }
];

const Tasks = () => {
  const [searchParams] = useSearchParams();
  const customerOnlyParam = searchParams.get('customerOnly');
  const isCustomerTasksView = customerOnlyParam === 'true';

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filteredDepartment, setFilteredDepartment] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [isTaskViewOpen, setIsTaskViewOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [documentType, setDocumentType] = useState<'sop' | 'dataFormat' | 'reportFormat' | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentVersion, setDocumentVersion] = useState('');
  const [isRevisionHistoryOpen, setIsRevisionHistoryOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<TaskDocument | null>(null);
  const [documentFiles, setDocumentFiles] = useState<{
    type: 'sop' | 'dataFormat' | 'reportFormat';
    file: File;
    version: string;
  }[]>([]);

  const form = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      assignType: "department",
      department: "",
      assignee: "",
      priority: "medium",
      dueDate: "",
      status: "not-started",
      isRecurring: false,
      recurringFrequency: "",
      attachmentsRequired: "none",
      isCustomerRelated: isCustomerTasksView,
      customerName: "",
    }
  });

  const getEmployeesByDepartment = (departmentId: string) => {
    const dept = departmentsData.find(d => d.id === departmentId);
    
    if (dept) {
      return employeesData.filter(emp => 
        emp.department === departmentId || 
        dept.subDepartments.some(sub => sub.id === emp.subDepartment)
      );
    } else {
      return employeesData.filter(emp => emp.subDepartment === departmentId);
    }
  };
  
  const handleDocumentFileSelect = (
    type: 'sop' | 'dataFormat' | 'reportFormat', 
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      const existingIndex = documentFiles.findIndex(doc => doc.type === type);
      
      if (existingIndex >= 0) {
        setDocumentFiles(prev => [
          ...prev.slice(0, existingIndex),
          { type, file, version: '1.0' },
          ...prev.slice(existingIndex + 1)
        ]);
      } else {
        setDocumentFiles(prev => [
          ...prev,
          { type, file, version: '1.0' }
        ]);
      }
    }
  };
  
  const removeDocumentFile = (type: 'sop' | 'dataFormat' | 'reportFormat') => {
    setDocumentFiles(prev => prev.filter(doc => doc.type !== type));
  };

  const handleAddTask = (data: z.infer<typeof taskFormSchema>) => {
    let assigneeData;
    let departmentName = "";
    
    if (data.assignType === "employee" && data.assignee) {
      assigneeData = employeesData.find(emp => emp.id === data.assignee);
      if (assigneeData) {
        const dept = flatDepartments.find(d => d.id === assigneeData?.department);
        departmentName = dept?.name || "";
      }
    } else if (data.assignType === "department" && data.department) {
      const dept = flatDepartments.find(d => d.id === data.department);
      departmentName = dept?.name || "";
    }
    
    const documents: TaskDocument[] = documentFiles.map(docFile => {
      const newRevision: DocumentRevision = {
        id: `doc-${Date.now()}-${docFile.type}`,
        fileName: docFile.file.name,
        version: docFile.version,
        uploadDate: new Date().toISOString(),
        uploadedBy: "Current User",
        fileSize: `${Math.round(docFile.file.size / 1024)} KB`,
      };
      
      return {
        documentType: docFile.type,
        revisions: [newRevision],
        currentRevisionId: newRevision.id
      };
    });
    
    const newTask: Task = {
      id: `t${tasks.length + 1}`,
      title: data.title,
      description: data.description,
      department: departmentName,
      assignee: data.assignee || "",
      priority: data.priority,
      dueDate: data.dueDate,
      status: data.status,
      isRecurring: data.isRecurring,
      recurringFrequency: data.recurringFrequency,
      attachmentsRequired: data.attachmentsRequired,
      isCustomerRelated: data.isCustomerRelated,
      customerName: data.customerName,
      createdAt: new Date().toISOString().split('T')[0],
      assigneeDetails: assigneeData ? {
        name: assigneeData.name,
        initials: assigneeData.initials,
        avatar: assigneeData.avatar,
        department: departmentName,
        position: assigneeData.position,
      } : data.assignType === "department" ? {
        name: departmentName,
        initials: departmentName.substring(0, 2).toUpperCase(),
        department: departmentName,
        position: "Department",
      } : undefined,
      attachments: [],
      documents: documents.length > 0 ? documents : undefined
    };
    
    setTasks([...tasks, newTask]);
    setIsAddDialogOpen(false);
    form.reset();
    setSelectedFiles([]);
    setDocumentFiles([]);
    
    toast({
      title: data.isCustomerRelated ? "Customer Task Created" : "Task Created",
      description: `The ${data.isCustomerRelated ? 'customer task' : 'task'} has been successfully created and assigned.`
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };
  
  const handleSingleDocumentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentFile(e.target.files[0]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskViewOpen(true);
  };

  const handleCompleteTask = (task: Task) => {
    if (task.attachmentsRequired === 'required' && (!task.attachments || task.attachments.length === 0)) {
      toast({
        title: "Cannot complete task",
        description: "This task requires attachments to be completed.",
        variant: "destructive"
      });
      return;
    }

    const updatedTasks = tasks.map(t => {
      if (t.id === task.id) {
        return { ...t, status: 'completed' as const };
      }
      return t;
    });

    setTasks(updatedTasks);
    setIsTaskViewOpen(false);
    
    toast({
      title: "Task Completed",
      description: "The task has been marked as completed."
    });
  };

  const handleAttachmentUpload = (task: Task) => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive"
      });
      return;
    }

    const newAttachments = selectedFiles.map((file, index) => ({
      id: `a${Date.now()}-${index}`,
      name: file.name,
      fileType: file.type,
      uploadedBy: "Current User",
      uploadDate: new Date().toISOString(),
      fileSize: `${Math.round(file.size / 1024)} KB`
    }));

    const updatedTasks = tasks.map(t => {
      if (t.id === task.id) {
        return { 
          ...t, 
          attachments: [...(t.attachments || []), ...newAttachments]
        };
      }
      return t;
    });

    setTasks(updatedTasks);
    setSelectedFiles([]);
    
    toast({
      title: "Attachments Uploaded",
      description: `${selectedFiles.length} file(s) have been uploaded successfully.`
    });
  };
  
  const handleAddDocument = (taskId: string) => {
    if (!documentType || !documentFile || !documentVersion.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide document type, file and version number.",
        variant: "destructive"
      });
      return;
    }
    
    const documentTypeLabels = {
      'sop': 'Standard Operating Procedure',
      'dataFormat': 'Data Recording Format',
      'reportFormat': 'Reporting Format'
    };
    
    const newRevision: DocumentRevision = {
      id: `doc-${Date.now()}`,
      fileName: documentFile.name,
      version: documentVersion,
      uploadDate: new Date().toISOString(),
      uploadedBy: "Current User",
      fileSize: `${Math.round(documentFile.size / 1024)} KB`,
    };
    
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        const existingDocuments = [...(t.documents || [])];
        const documentIndex = existingDocuments.findIndex(doc => doc.documentType === documentType);
        
        if (documentIndex >= 0) {
          existingDocuments[documentIndex] = {
            ...existingDocuments[documentIndex],
            revisions: [...existingDocuments[documentIndex].revisions, newRevision],
            currentRevisionId: newRevision.id
          };
        } else {
          existingDocuments.push({
            documentType: documentType,
            revisions: [newRevision],
            currentRevisionId: newRevision.id
          });
        }
        
        return {
          ...t,
          documents: existingDocuments
        };
      }
      return t;
    });
    
    setTasks(updatedTasks);
    setDocumentFile(null);
    setDocumentVersion('');
    setDocumentType(null);
    setIsDocumentDialogOpen(false);
    
    toast({
      title: "Document Added",
      description: `${documentTypeLabels[documentType]} document (version ${documentVersion}) has been added successfully.`
    });
  };
  
  const handleViewRevisionHistory = (document: TaskDocument) => {
    setCurrentDocument(document);
    setIsRevisionHistoryOpen(true);
  };
  
  const handleSetCurrentRevision = (task: Task, documentType: string, revisionId: string) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === task.id) {
        const updatedDocuments = t.documents?.map(doc => {
          if (doc.documentType === documentType) {
            return {
              ...doc,
              currentRevisionId: revisionId
            };
          }
          return doc;
        });
        
        return {
          ...t,
          documents: updatedDocuments
        };
      }
      return t;
    });
    
    setTasks(updatedTasks);
    setIsRevisionHistoryOpen(false);
    
    toast({
      title: "Revision Updated",
      description: "Current document revision has been updated."
    });
  };

  const filterTasks = () => {
    let tasksToFilter = isCustomerTasksView 
      ? tasks.filter(task => task.isCustomerRelated) 
      : tasks;
    
    return tasksToFilter.filter(task => {
      const matchesSearch = 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.assigneeDetails?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (task.customerName?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesDepartment = !filteredDepartment || task.department === filteredDepartment;
      
      const matchesTab = selectedTab === "all" || 
        (selectedTab === "recurring" && task.isRecurring) ||
        (selectedTab === "upcoming" && new Date(task.dueDate) > new Date() && task.status !== "completed") ||
        (selectedTab === "completed" && task.status === "completed") ||
        (selectedTab === "overdue" && (task.status === "overdue" || 
          (new Date(task.dueDate) < new Date() && task.status !== "completed")));
      
      return matchesSearch && matchesDepartment && matchesTab;
    });
  };

  const filteredTasks = filterTasks();
  
  const getDocumentTypeLabel = (type: string): string => {
    switch (type) {
      case 'sop': return 'Standard Operating Procedure (SOP)';
      case 'dataFormat': return 'Data Recording Format';
      case 'reportFormat': return 'Reporting Format';
      default: return 'Document';
    }
  };
  
  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'sop': return <FileText className="h-5 w-5 text-green-500" />;
      case 'dataFormat': return <Database className="h-5 w-5 text-blue-500" />;
      case 'reportFormat': return <PieChart className="h-5 w-5 text-amber-500" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isCustomerTasksView ? "Customer Tasks" : "Tasks Management"}</h1>
        <p className="text-muted-foreground">
          {isCustomerTasksView 
            ? "Manage and prioritize customer-related tasks" 
            : "Assign, track and manage tasks across your organization"}
        </p>
      </div>
      
      {isCustomerTasksView && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-center gap-2">
          <div className="bg-blue-100 p-1 rounded-full">
            <User className="h-4 w-4 text-blue-700" />
          </div>
          <p className="text-sm text-blue-800">
            Customer tasks are prioritized for immediate attention. These tasks directly impact customer satisfaction and service levels.
          </p>
        </div>
      )}
      
      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="grid grid-cols-5 w-[600px]">
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="recurring">Recurring</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search tasks..." 
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
              className="bg-primary hover:bg-primary/90"
              onClick={() => {
                form.setValue("isCustomerRelated", isCustomerTasksView);
                setIsAddDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add {isCustomerTasksView ? "Customer Task" : "Task"}
            </Button>
          </div>
        </div>
        
        <TabsContent value="all" className="mt-4">
          <TasksTable tasks={filteredTasks} onViewTask={handleViewTask} />
        </TabsContent>
        
        <TabsContent value="recurring" className="mt-4">
          <TasksTable tasks={filteredTasks} onViewTask={handleViewTask} />
        </TabsContent>
        
        <TabsContent value="upcoming" className="mt-4">
          <TasksTable tasks={filteredTasks} onViewTask={handleViewTask} />
        </TabsContent>
        
        <TabsContent value="completed" className="mt-4">
          <TasksTable tasks={filteredTasks} onViewTask={handleViewTask} />
        </TabsContent>
        
        <TabsContent value="overdue" className="mt-4">
          <TasksTable tasks={filteredTasks} onViewTask={handleViewTask} />
        </TabsContent>
      </Tabs>
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New {form.watch("isCustomerRelated") ? "Customer Task" : "Task"}</DialogTitle>
            <DialogDescription>
              Create a new task and assign it to a department or team member. You can upload task-related documents.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddTask)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter task title" {...field} />
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
                        placeholder="Enter task description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isCustomerRelated"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Customer Related Task
                      </FormLabel>
                      <FormDescription>
                        Mark if this task is directly related to a customer
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              {form.watch("isCustomerRelated") && (
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter customer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="assignType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignment Type</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        value={field.value}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="department" id="department" />
                          <Label htmlFor="department">Assign to Department</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="employee" id="employee" />
                          <Label htmlFor="employee">Assign to Employee</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.watch("assignType") === "department" && (
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departmentsData.map((dept) => (
                            <React.Fragment key={dept.id}>
                              <SelectItem value={dept.id}>{dept.name}</SelectItem>
                              {dept.subDepartments.length > 0 && (
                                <SelectGroup>
                                  {dept.subDepartments.map((subDept) => (
                                    <SelectItem 
                                      key={subDept.id} 
                                      value={subDept.id}
                                      className="pl-6"
                                    >
                                      {subDept.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              )}
                            </React.Fragment>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
                
              {form.watch("assignType") === "employee" && (
                <FormField
                  control={form.control}
                  name="assignee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignee</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employeesData.map(employee => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name} - {employee.position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
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

              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Recurring Task</FormLabel>
                      <FormDescription>
                        Set if this task should repeat on a schedule
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch("isRecurring") && (
                <FormField
                  control={form.control}
                  name="recurringFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="attachmentsRequired"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attachments</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select attachment requirement" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Not Required</SelectItem>
                        <SelectItem value="optional">Optional</SelectItem>
                        <SelectItem value="required">Required</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-6">
                <h3 className="text-sm font-medium mb-2">Task Documents</h3>
                
                <div className="space-y-2">
                  <div className="border rounded-md p-3">
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      Standard Operating Procedure (SOP)
                    </h4>
                    {documentFiles.find(doc => doc.type === 'sop') ? (
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {documentFiles.find(doc => doc.type === 'sop')?.file.name} (v{documentFiles.find(doc => doc.type === 'sop')?.version})
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocumentFile('sop')}
                          className="h-6 px-2 text-xs"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          onChange={(e) => handleDocumentFileSelect('sop', e)}
                          className="text-xs h-8"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4 text-blue-600" />
                      Data Recording Format
                    </h4>
                    {documentFiles.find(doc => doc.type === 'dataFormat') ? (
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {documentFiles.find(doc => doc.type === 'dataFormat')?.file.name} (v{documentFiles.find(doc => doc.type === 'dataFormat')?.version})
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocumentFile('dataFormat')}
                          className="h-6 px-2 text-xs"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          onChange={(e) => handleDocumentFileSelect('dataFormat', e)}
                          className="text-xs h-8"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <PieChart className="h-4 w-4 text-amber-600" />
                      Reporting Format
                    </h4>
                    {documentFiles.find(doc => doc.type === 'reportFormat') ? (
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {documentFiles.find(doc => doc.type === 'reportFormat')?.file.name} (v{documentFiles.find(doc => doc.type === 'reportFormat')?.version})
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocumentFile('reportFormat')}
                          className="h-6 px-2 text-xs"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          onChange={(e) => handleDocumentFileSelect('reportFormat', e)}
                          className="text-xs h-8"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Task
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;
