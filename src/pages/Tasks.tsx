
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Calendar, CalendarCheck, User, Paperclip, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { TaskList } from "@/components/dashboard/TaskList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
});

type Task = z.infer<typeof taskFormSchema> & { 
  id: string; 
  createdAt: string; 
  assigneeDetails?: {
    name: string;
    avatar?: string;
    initials: string;
    department: string;
    position: string;
  };
  attachments?: {
    id: string;
    name: string;
    fileType: string;
    uploadedBy: string;
    uploadDate: string;
    fileSize: string;
  }[];
};

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
    attachmentsRequired: "required"
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
    attachmentsRequired: "optional"
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
    attachmentsRequired: "required"
  }
];

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filteredDepartment, setFilteredDepartment] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [isTaskViewOpen, setIsTaskViewOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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
    }
  });

  const getEmployeesByDepartment = (department: string) => {
    return employeesData.filter(emp => emp.department === department);
  };

  const handleDepartmentChange = (value: string) => {
    form.setValue("department", value);
    form.setValue("assignee", "");
  };

  const handleAddTask = (data: z.infer<typeof taskFormSchema>) => {
    const assigneeData = employeesData.find(emp => emp.id === data.assignee);
    
    const newTask: Task = {
      id: `t${tasks.length + 1}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0],
      assigneeDetails: assigneeData ? {
        name: assigneeData.name,
        initials: assigneeData.initials,
        avatar: assigneeData.avatar,
        department: assigneeData.department,
        position: assigneeData.position,
      } : undefined,
      attachments: []
    };
    
    setTasks([...tasks, newTask]);
    setIsAddDialogOpen(false);
    form.reset();
    setSelectedFiles([]);
    
    toast({
      title: "Task Created",
      description: "The task has been successfully created and assigned."
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
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

  const filterTasks = () => {
    return tasks.filter(task => {
      const matchesSearch = 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.assigneeDetails?.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
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
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tasks Management</h1>
        <p className="text-muted-foreground">Assign, track and manage tasks across your organization</p>
      </div>
      
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
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Task
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
            <DialogTitle>Add New Task</DialogTitle>
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
                <Button type="submit">Create Task</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isTaskViewOpen} onOpenChange={setIsTaskViewOpen}>
        <DialogContent className="sm:max-w-[650px]">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedTask.title}</span>
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
                
                {(selectedTask.attachmentsRequired === "required" || selectedTask.attachmentsRequired === "optional") && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Uploaded Attachments</h3>
                    
                    {(!selectedTask.attachments || selectedTask.attachments.length === 0) ? (
                      <p className="text-sm text-muted-foreground">No attachments uploaded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedTask.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between p-2 border rounded-md">
                            <div className="flex items-center gap-2">
                              <Paperclip className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{attachment.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {attachment.fileSize} • Uploaded on {new Date(attachment.uploadDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <h3 className="text-sm font-medium mb-2">Upload New Attachments</h3>
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="task-attachments" className="cursor-pointer">
                            <div className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-md hover:bg-muted/50 transition-colors">
                              <Upload className="h-4 w-4" />
                              <span>Select files</span>
                            </div>
                          </Label>
                          <input
                            type="file"
                            id="task-attachments"
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                          />
                          {selectedFiles.length > 0 && (
                            <Button 
                              size="sm"
                              onClick={() => handleAttachmentUpload(selectedTask)}
                            >
                              Upload {selectedFiles.length} file(s)
                            </Button>
                          )}
                        </div>
                        
                        {selectedFiles.length > 0 && (
                          <div className="space-y-2 mt-2">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                                <div className="flex items-center gap-2">
                                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm font-medium">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {Math.round(file.size / 1024)} KB • {file.type || 'Unknown type'}
                                    </p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => removeFile(index)}>
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
                {selectedTask.status !== "completed" && (
                  <Button onClick={() => handleCompleteTask(selectedTask)}>
                    Mark as Completed
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const TasksTable = ({ tasks, onViewTask }: { tasks: Task[], onViewTask: (task: Task) => void }) => {
  return (
    <Card className="border-border">
      <CardHeader className="excel-header py-2">
        <CardTitle className="text-lg">Tasks</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-border">
          <table className="w-full border-collapse">
            <thead>
              <tr className="excel-header border-b border-border text-left">
                <th className="px-4 py-2 font-medium">Task</th>
                <th className="px-4 py-2 font-medium">Department</th>
                <th className="px-4 py-2 font-medium">Assignee</th>
                <th className="px-4 py-2 font-medium w-[150px]">Due Date</th>
                <th className="px-4 py-2 font-medium">Priority</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Recurring</th>
                <th className="px-4 py-2 font-medium">Attachments</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <tr 
                    key={task.id} 
                    className="excel-row border-b border-border cursor-pointer hover:bg-muted/30"
                    onClick={() => onViewTask(task)}
                  >
                    <td className="px-4 py-2">
                      <div>
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[300px]">{task.description}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2">{task.department}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assigneeDetails?.avatar} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {task.assigneeDetails?.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{task.assigneeDetails?.name}</div>
                          <div className="text-xs text-muted-foreground">{task.assigneeDetails?.position}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{task.dueDate}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-4 py-2">
                      {task.isRecurring ? (
                        <div className="flex items-center gap-1">
                          <CalendarCheck className="h-3 w-3 text-blue-500" />
                          <span className="capitalize">{task.recurringFrequency}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {task.attachmentsRequired === 'required' || task.attachmentsRequired === 'optional' ? (
                        <div className="flex items-center gap-1">
                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                          <span className="capitalize">{task.attachmentsRequired}</span>
                          {task.attachments && task.attachments.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {task.attachments.length}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No tasks found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  switch (priority) {
    case 'low':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">Low</Badge>;
    case 'medium':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100">Medium</Badge>;
    case 'high':
      return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100">High</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'not-started':
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 hover:bg-gray-100">Not Started</Badge>;
    case 'in-progress':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">In Progress</Badge>;
    case 'completed':
      return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">Completed</Badge>;
    case 'overdue':
      return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100">Overdue</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export default Tasks;
