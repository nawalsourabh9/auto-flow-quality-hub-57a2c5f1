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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TaskForm from "@/components/tasks/TaskForm";
import { useTasks } from "@/hooks/use-tasks";

const Tasks = () => {
  const { data: tasks = [], isLoading } = useTasks();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all-tasks");

  const isDepartmentHead = () => {
    // In a real app, this would check the user's role
    return true;
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const pendingTasks = tasks.filter(task => task.approval_status === 'pending');

  const filteredPendingTasks = pendingTasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    
    return matchesSearch && matchesPriority;
  });

  const handleViewTask = (task: Task) => {
    console.log("View task:", task);
    toast({
      title: "Task Selected",
      description: `Viewing task: ${task.title}`
    });
  };

  const handleApproveTask = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          approval_status: 'approved',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;

      toast({
        title: "Task Approved",
        description: `Task "${task.title}" has been approved`
      });
    } catch (error) {
      console.error('Error approving task:', error);
      toast({
        title: "Error",
        description: "Failed to approve task",
        variant: "destructive"
      });
    }
  };

  const handleRejectTask = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          approval_status: 'rejected',
          rejected_by: (await supabase.auth.getUser()).data.user?.id,
          rejected_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;

      toast({
        title: "Task Rejected",
        description: `Task "${task.title}" has been rejected`
      });
    } catch (error) {
      console.error('Error rejecting task:', error);
      toast({
        title: "Error",
        description: "Failed to reject task",
        variant: "destructive"
      });
    }
  };

  const handleCreateTask = async (newTask: Omit<Task, "id" | "created_at">) => {
    try {
      const needsApproval = !isDepartmentHead();
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...newTask,
          approval_status: needsApproval ? 'pending' : 'approved',
          status: 'not-started'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: needsApproval ? "Task Submitted for Approval" : "Task Created",
        description: needsApproval 
          ? "Your task has been submitted and is awaiting approval."
          : `Task "${data.title}" has been created successfully.`
      });

      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <TaskForm onSubmit={handleCreateTask} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;
