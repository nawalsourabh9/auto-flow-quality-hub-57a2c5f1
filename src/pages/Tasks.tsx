
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, FileText, Database, PieChart, FileUp, History, CheckCircle, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const taskFormSchema = z.object({
  title: z.string().min(3, { message: "Task title must be at least 3 characters." }),
  description: z.string().min(5, { message: "Description must be at least 5 characters." }),
  department: z.string().min(1, { message: "Please select a department." }),
  assignee: z.string().min(1, { message: "Please select an assignee." }),
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

const departmentOptions = ["Quality", "Production", "Engineering", "HR", "Finance", "IT", "Sales", "Marketing"];

const employeesData = [
  { id: "1", name: "John Doe", department: "Quality", position: "Quality Manager", initials: "JD", avatar: "" },
  { id: "2", name: "Jane Smith", department: "Production", position: "Production Lead", initials: "JS", avatar: "" },
  { id: "3", name: "Robert Johnson", department: "Engineering", position: "Design Engineer", initials: "RJ", avatar: "" },
  { id: "4", name: "Emily Davis", department: "Quality", position: "Quality Analyst", initials: "ED", avatar: "" },
  { id: "5", name: "Michael Brown", department: "IT", position: "IT Support", initials: "MB", avatar: "" },
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
  
  // Document upload states
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

  const getEmployeesByDepartment = (department: string) => {
    return employeesData.filter(emp => emp.department === department);
  };

  const handleDepartmentChange = (value: string) => {
    form.setValue("department", value);
    form.setValue("assignee", "");
  };
  
  const handleDocumentFileSelect = (
    type: 'sop' | 'dataFormat' | 'reportFormat', 
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if this document type already exists
      const existingIndex = documentFiles.findIndex(doc => doc.type === type);
      
      if (existingIndex >= 0) {
        // Replace existing document
        setDocumentFiles(prev => [
          ...prev.slice(0, existingIndex),
          { type, file, version: '1.0' },
          ...prev.slice(existingIndex + 1)
        ]);
      } else {
        // Add new document
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
    const assigneeData = employeesData.find(emp => emp.id === data.assignee);
    
    // Create documents from the uploaded files
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
      department: data.department,
      assignee: data.assignee,
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
        department: assigneeData.department,
        position: assigneeData.position,
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
          // Update existing document type with new revision
          existingDocuments[documentIndex] = {
            ...existingDocuments[documentIndex],
            revisions: [...existingDocuments[documentIndex].revisions, newRevision],
            currentRevisionId: newRevision.id
          };
        } else {
          // Add new document type
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
              Create a new task and assign it to a team member. You can upload task-related documents after creating the task.
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
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select
                        onValueChange={(value) => handleDepartmentChange(value)}
                        value={field.value}
                      >
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
                          {form.watch("department") ? 
                            getEmployeesByDepartment(form.watch("department")).map(emp => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.name} - {emp.position}
                              </SelectItem>
                            ))
                            : 
                            <SelectItem value="no-selection" disabled>Select department first</SelectItem>
                          }
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
              </div>
              
              <FormField
                control={form.control}
                name="attachmentsRequired"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attachment Requirements</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Attachment requirements" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Attachments</SelectItem>
                        <SelectItem value="optional">Optional Attachments</SelectItem>
                        <SelectItem value="required">Required Attachments</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Specify if this task requires document attachments
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="border rounded-md p-4">
                <h3 className="text-sm font-medium mb-4">Task Documents</h3>
                <div className="space-y-4">
                  {/* SOP Document Upload */}
                  <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-500" />
                      <div>
                        <h4 className="text-sm font-medium">Standard Operating Procedure (SOP)</h4>
                        <p className="text-xs text-muted-foreground">Upload the SOP document if applicable</p>
                      </div>
                    </div>
                    {documentFiles.find(doc => doc.type === 'sop') ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {documentFiles.find(doc => doc.type === 'sop')?.file.name}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeDocumentFile('sop')}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Input
                          id="sop-upload"
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleDocumentFileSelect('sop', e)}
                        />
                        <Label htmlFor="sop-upload" className="cursor-pointer">
                          <Button type="button" variant="outline" size="sm">
                            Upload
                          </Button>
                        </Label>
                      </div>
                    )}
                  </div>
                  
                  {/* Data Format Document Upload */}
                  <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-blue-500" />
                      <div>
                        <h4 className="text-sm font-medium">Data Recording Format</h4>
                        <p className="text-xs text-muted-foreground">Upload data recording template if applicable</p>
                      </div>
                    </div>
                    {documentFiles.find(doc => doc.type === 'dataFormat') ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {documentFiles.find(doc => doc.type === 'dataFormat')?.file.name}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeDocumentFile('dataFormat')}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Input
                          id="data-format-upload"
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xlsx,.xls,.csv"
                          onChange={(e) => handleDocumentFileSelect('dataFormat', e)}
                        />
                        <Label htmlFor="data-format-upload" className="cursor-pointer">
                          <Button type="button" variant="outline" size="sm">
                            Upload
                          </Button>
                        </Label>
                      </div>
                    )}
                  </div>
                  
                  {/* Report Format Document Upload */}
                  <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                    <div className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-amber-500" />
                      <div>
                        <h4 className="text-sm font-medium">Reporting Format</h4>
                        <p className="text-xs text-muted-foreground">Upload reporting template if applicable</p>
                      </div>
                    </div>
                    {documentFiles.find(doc => doc.type === 'reportFormat') ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {documentFiles.find(doc => doc.type === 'reportFormat')?.file.name}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeDocumentFile('reportFormat')}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Input
                          id="report-format-upload"
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx"
                          onChange={(e) => handleDocumentFileSelect('reportFormat', e)}
                        />
                        <Label htmlFor="report-format-upload" className="cursor-pointer">
                          <Button type="button" variant="outline" size="sm">
                            Upload
                          </Button>
                        </Label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {form.watch("isRecurring") && (
                <FormField
                  control={form.control}
                  name="recurringFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "none"}>
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
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Create {form.watch("isCustomerRelated") ? "Customer Task" : "Task"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* View Task Dialog */}
      <Dialog open={isTaskViewOpen} onOpenChange={setIsTaskViewOpen}>
        <DialogContent className="sm:max-w-[650px]">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{selectedTask.title}</span>
                    {selectedTask.isCustomerRelated && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Customer: {selectedTask.customerName || "Unnamed"}
                      </Badge>
                    )}
                  </div>
                  <StatusBadge status={selectedTask.status} />
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div>
                  <h3 className="text-sm font-medium">Description</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedTask.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">Assigned To</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={selectedTask.assigneeDetails?.avatar} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          {selectedTask.assigneeDetails?.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{selectedTask.assigneeDetails?.name}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Due Date</h3>
                    <p className="mt-1 text-sm">{selectedTask.dueDate}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">Department</h3>
                    <p className="mt-1 text-sm">{selectedTask.department}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Priority</h3>
                    <div className="mt-1">
                      <PriorityBadge priority={selectedTask.priority} />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Attachments</h3>
                    <div className="mt-1">
                      {selectedTask.attachmentsRequired === "required" ? (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">Required</Badge>
                      ) : selectedTask.attachmentsRequired === "optional" ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">Optional</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Task Documents Section */}
                {selectedTask.documents && selectedTask.documents.length > 0 && (
                  <div className="border rounded-md p-4 mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium">Task Documents</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 text-xs"
                        onClick={() => {
                          setDocumentType(null);
                          setIsDocumentDialogOpen(true);
                        }}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Document
                      </Button>
                    </div>
                    
                    <Accordion type="single" collapsible className="w-full">
                      {selectedTask.documents.map((doc, index) => {
                        const currentRevision = doc.revisions.find(rev => rev.id === doc.currentRevisionId);
                        const label = getDocumentTypeLabel(doc.documentType);
                        const icon = getDocumentTypeIcon(doc.documentType);
                        
                        return (
                          <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="py-2">
                              <div className="flex items-center gap-2">
                                {icon}
                                <span>{label}</span>
                                {currentRevision && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-gray-50">
                                    v{currentRevision.version}
                                  </Badge>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="py-2 space-y-3">
                                {!currentRevision ? (
                                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                                    <span className="text-sm text-muted-foreground">No document uploaded yet</span>
                                    <Button 
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setDocumentType(doc.documentType);
                                        setIsDocumentDialogOpen(true);
                                      }}
                                    >
                                      <FileUp className="h-3.5 w-3.5 mr-1.5" />
                                      Upload
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center justify-between px-2">
                                      <div className="flex items-center">
                                        <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                        <span className="text-sm font-medium">{currentRevision.fileName}</span>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button 
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleViewRevisionHistory(doc)}
                                        >
                                          <History className="h-3.5 w-3.5 mr-1" />
                                          History
                                        </Button>
                                        <Button 
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setDocumentType(doc.documentType);
                                            setIsDocumentDialogOpen(true);
                                          }}
                                        >
                                          <FileUp className="h-3.5 w-3.5 mr-1" />
                                          Update
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="p-2 mt-2 border rounded-md bg-gray-50">
                                      <p className="text-xs text-muted-foreground">
                                        Version {currentRevision.version} • Uploaded {new Date(currentRevision.uploadDate).toLocaleDateString()} • {currentRevision.fileSize}
                                      </p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </div>
                )}
                
                <div className="flex justify-between mt-4">
                  <div>
                    {selectedTask.attachmentsRequired !== 'none' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "File Upload",
                            description: "File upload functionality would be implemented here."
                          });
                        }}
                      >
                        <FileUp className="h-4 w-4 mr-2" />
                        Upload Files
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsTaskViewOpen(false)}
                    >
                      Close
                    </Button>
                    {selectedTask.status !== 'completed' && (
                      <Button 
                        size="sm"
                        onClick={() => handleCompleteTask(selectedTask)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete Task
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Upload Dialog */}
      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Add or update a document for this task
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="document-type">Document Type</Label>
              <Select value={documentType || ''} onValueChange={(value: any) => setDocumentType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sop">Standard Operating Procedure (SOP)</SelectItem>
                  <SelectItem value="dataFormat">Data Recording Format</SelectItem>
                  <SelectItem value="reportFormat">Reporting Format</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="document-file">Document File</Label>
              <Input 
                id="document-file" 
                type="file" 
                onChange={handleSingleDocumentFileSelect} 
                accept=".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx,.csv"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="document-version">Version</Label>
              <Input 
                id="document-version" 
                value={documentVersion}
                onChange={(e) => setDocumentVersion(e.target.value)}
                placeholder="e.g., 1.0, 2.1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDocumentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedTask && handleAddDocument(selectedTask.id)}>
              Upload Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Revision History Dialog */}
      <Dialog open={isRevisionHistoryOpen} onOpenChange={setIsRevisionHistoryOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Document Revision History</DialogTitle>
          </DialogHeader>
          
          {currentDocument && currentDocument.revisions.length > 0 ? (
            <div className="space-y-4 py-2">
              <p className="text-sm font-medium">
                {getDocumentTypeLabel(currentDocument.documentType)}
              </p>
              
              <div className="border rounded-md divide-y">
                {[...currentDocument.revisions].reverse().map((revision, index) => (
                  <div key={index} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">{revision.fileName}</span>
                        <Badge variant="outline" className="text-xs bg-gray-50">v{revision.version}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Uploaded on {new Date(revision.uploadDate).toLocaleDateString()} • {revision.fileSize}
                      </p>
                    </div>
                    
                    {revision.id === currentDocument.currentRevisionId ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Current</Badge>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => selectedTask && handleSetCurrentRevision(
                          selectedTask, 
                          currentDocument.documentType, 
                          revision.id
                        )}
                      >
                        Set as Current
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground py-4">No revision history available.</p>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsRevisionHistoryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;
