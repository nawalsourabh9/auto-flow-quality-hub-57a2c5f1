
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Calendar, CalendarCheck, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { TaskList } from "@/components/dashboard/TaskList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Task form schema
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
};

// Dummy departments data
const departmentOptions = ["Quality", "Production", "Engineering", "HR", "Finance", "IT", "Sales", "Marketing"];

// Dummy employees data
const employeesData = [
  { id: "1", name: "John Doe", department: "Quality", position: "Quality Manager", initials: "JD", avatar: "" },
  { id: "2", name: "Jane Smith", department: "Production", position: "Production Lead", initials: "JS", avatar: "" },
  { id: "3", name: "Robert Johnson", department: "Engineering", position: "Design Engineer", initials: "RJ", avatar: "" },
  { id: "4", name: "Emily Davis", department: "Quality", position: "Quality Analyst", initials: "ED", avatar: "" },
  { id: "5", name: "Michael Brown", department: "IT", position: "IT Support", initials: "MB", avatar: "" },
];

// Dummy tasks data
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
    recurringFrequency: "daily"
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
    recurringFrequency: "weekly"
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
    recurringFrequency: "monthly"
  }
];

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filteredDepartment, setFilteredDepartment] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  // Create form
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
    }
  });

  // Filter employees by department for assignee dropdown
  const getEmployeesByDepartment = (department: string) => {
    return employeesData.filter(emp => emp.department === department);
  };

  // Handle department change in form
  const handleDepartmentChange = (value: string) => {
    form.setValue("department", value);
    form.setValue("assignee", ""); // Reset assignee when department changes
  };

  // Handle task creation
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
      } : undefined
    };
    
    setTasks([...tasks, newTask]);
    setIsAddDialogOpen(false);
    form.reset();
    
    toast({
      title: "Task Created",
      description: "The task has been successfully created and assigned."
    });
  };

  // Filter tasks
  const filterTasks = () => {
    return tasks.filter(task => {
      // Filter by search term
      const matchesSearch = 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.assigneeDetails?.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by department
      const matchesDepartment = !filteredDepartment || task.department === filteredDepartment;
      
      // Filter by tab/status
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
            <Select value={filteredDepartment || ""} onValueChange={(value) => setFilteredDepartment(value || null)}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
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
          <TasksTable tasks={filteredTasks} />
        </TabsContent>
        
        <TabsContent value="recurring" className="mt-4">
          <TasksTable tasks={filteredTasks} />
        </TabsContent>
        
        <TabsContent value="upcoming" className="mt-4">
          <TasksTable tasks={filteredTasks} />
        </TabsContent>
        
        <TabsContent value="completed" className="mt-4">
          <TasksTable tasks={filteredTasks} />
        </TabsContent>
        
        <TabsContent value="overdue" className="mt-4">
          <TasksTable tasks={filteredTasks} />
        </TabsContent>
      </Tabs>
      
      {/* Add Task Dialog */}
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
                            <SelectItem value="" disabled>Select department first</SelectItem>
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
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Recurring Task</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Is this a recurring task that needs to be performed regularly?
                      </p>
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
                      <Select onValueChange={field.onChange} value={field.value || ""}>
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
    </div>
  );
};

// Tasks Table Component
const TasksTable = ({ tasks }: { tasks: Task[] }) => {
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
              </tr>
            </thead>
            <tbody>
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <tr key={task.id} className="excel-row border-b border-border">
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
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

// Priority Badge Component
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

// Status Badge Component
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
