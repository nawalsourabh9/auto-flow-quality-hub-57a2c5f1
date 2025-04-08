
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Task } from "@/types/task";
import TasksTable from "@/components/tasks/TaskTable";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

// Sample pending approval tasks
const pendingApprovalTasks: Task[] = [
  {
    id: "4",
    title: "Equipment Calibration for Lab Instruments",
    description: "Perform quarterly calibration of all laboratory instruments",
    department: "Quality",
    assignee: "",
    priority: "high",
    dueDate: "2025-04-25",
    status: "not-started",
    createdAt: "2025-04-07",
    isRecurring: true,
    recurringFrequency: "Quarterly",
    attachmentsRequired: "required",
    assigneeDetails: {
      name: "",
      initials: "",
      department: "Quality",
      position: ""
    }
  },
  {
    id: "5",
    title: "Regulatory Compliance Review",
    description: "Review recent regulatory changes and update compliance documentation",
    department: "Regulatory",
    assignee: "",
    priority: "medium",
    dueDate: "2025-04-30",
    status: "not-started",
    createdAt: "2025-04-08",
    isRecurring: false,
    attachmentsRequired: "optional",
    assigneeDetails: {
      name: "",
      initials: "",
      department: "Regulatory",
      position: ""
    }
  }
];

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [pendingTasks, setPendingTasks] = useState<Task[]>(pendingApprovalTasks);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all-tasks");

  // Check if the current user is a department head (mock function)
  const isDepartmentHead = () => {
    // In a real app, this would check the user's role
    return true;
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const filteredPendingTasks = pendingTasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    
    return matchesSearch && matchesPriority;
  });

  const handleViewTask = (task: Task) => {
    console.log("View task:", task);
    toast({
      title: "Task Selected",
      description: `Viewing task: ${task.title}`
    });
    // Task viewing logic here
  };

  const handleApproveTask = (task: Task) => {
    // In a real app, this would call an API to approve the task
    setPendingTasks(pendingTasks.filter(t => t.id !== task.id));
    
    // Add the task to the regular tasks list with a random assignee
    const assignees = ["JD", "SM", "RJ"];
    const randomAssignee = assignees[Math.floor(Math.random() * assignees.length)];
    const assigneeDetails = {
      name: randomAssignee === "JD" ? "John Doe" : randomAssignee === "SM" ? "Sarah Miller" : "Robert Johnson",
      initials: randomAssignee,
      department: task.department,
      position: randomAssignee === "JD" ? "Process Engineer" : randomAssignee === "SM" ? "Quality Specialist" : "Quality Manager"
    };
    
    const approvedTask: Task = {
      ...task,
      assignee: randomAssignee,
      assigneeDetails,
      status: "not-started"
    };
    
    setTasks([...tasks, approvedTask]);
    
    toast({
      title: "Task Approved",
      description: `Task "${task.title}" has been approved and assigned to ${assigneeDetails.name}`
    });
  };

  const handleRejectTask = (task: Task) => {
    // In a real app, this would call an API to reject the task
    setPendingTasks(pendingTasks.filter(t => t.id !== task.id));
    
    toast({
      title: "Task Rejected",
      description: `Task "${task.title}" has been rejected`
    });
  };

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

      {isDepartmentHead() && pendingTasks.length > 0 && activeTab !== "pending-approval" && (
        <Card className="bg-amber-50 border-amber-200">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-amber-600 h-5 w-5" />
              <div>
                <p className="font-medium text-amber-800">Tasks Pending Your Approval</p>
                <p className="text-sm text-amber-700">
                  {pendingTasks.length} {pendingTasks.length === 1 ? "task needs" : "tasks need"} your approval
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800"
              onClick={() => setActiveTab("pending-approval")}
            >
              View Tasks
            </Button>
          </div>
        </Card>
      )}

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
        <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="not-started">Not Started</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter || "all"} onValueChange={(value) => setPriorityFilter(value === "all" ? null : value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isDepartmentHead() && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all-tasks">All Tasks</TabsTrigger>
            <TabsTrigger value="pending-approval" className="relative">
              Pending Approval
              {pendingTasks.length > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 bg-amber-200 text-amber-800 hover:bg-amber-200"
                >
                  {pendingTasks.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all-tasks" className="pt-4">
            <TasksTable tasks={filteredTasks} onViewTask={handleViewTask} />
          </TabsContent>
          
          <TabsContent value="pending-approval" className="pt-4">
            {filteredPendingTasks.length === 0 ? (
              <Card>
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">No tasks pending approval</p>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="p-0">
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left text-sm font-medium">Task</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Department</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Due Date</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Priority</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPendingTasks.map((task) => (
                          <tr key={task.id} className="border-b hover:bg-muted/50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium">{task.title}</p>
                                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                  {task.description}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">{task.department}</td>
                            <td className="px-4 py-3 text-sm">{task.dueDate}</td>
                            <td className="px-4 py-3">
                              <Badge variant={
                                task.priority === "high" ? "destructive" :
                                task.priority === "medium" ? "default" : "secondary"
                              }>
                                {task.priority}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm">{task.createdAt}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleApproveTask(task)}>
                                  Approve
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleRejectTask(task)}>
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {!isDepartmentHead() && (
        <TasksTable tasks={filteredTasks} onViewTask={handleViewTask} />
      )}
    </div>
  );
};

export default Tasks;
