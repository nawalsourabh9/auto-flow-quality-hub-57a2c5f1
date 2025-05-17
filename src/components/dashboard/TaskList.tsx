
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface TaskListProps {
  tasks: {
    id: string;
    title: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
    status: 'completed' | 'in-progress' | 'overdue' | 'not-started';
    assignee: {
      name: string;
      initials: string;
    };
    isCustomerRelated?: boolean;
    customerName?: string;
    department?: string;
  }[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  // Format due date to DD-MM-YYYY
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      // Try to parse the date and format it
      return format(new Date(dateString), 'dd-MM-yyyy');
    } catch (error) {
      // If parsing fails, return the original string
      return dateString;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm">{task.title}</h3>
                  {task.isCustomerRelated && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                      {task.customerName || 'Customer'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center text-sm">
                  <Badge 
                    variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                    className="mr-2"
                  >
                    {task.priority}
                  </Badge>
                  <Badge 
                    variant={task.status === 'completed' ? 'outline' : 
                            task.status === 'overdue' ? 'destructive' : 
                            task.status === 'in-progress' ? 'default' : 
                            'secondary'}
                  >
                    {task.status}
                  </Badge>
                  {task.department && (
                    <Badge variant="outline" className="ml-2 bg-gray-50">
                      {task.department}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {formatDate(task.dueDate)}
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{task.assignee.initials}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskList;
