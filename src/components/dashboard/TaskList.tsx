
import { CheckCircle, Clock, AlertCircle, Paperclip } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'completed' | 'in-progress' | 'overdue';
  assignee: {
    name: string;
    avatar?: string;
    initials: string;
  };
  attachmentsRequired?: 'required' | 'optional' | 'none';
}

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100">Medium</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100">High</Badge>;
    }
  };

  const getAttachmentBadge = (attachmentsRequired?: Task['attachmentsRequired']) => {
    switch (attachmentsRequired) {
      case 'required':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100 flex items-center gap-1">
          <Paperclip className="h-3 w-3" /> Required
        </Badge>;
      case 'optional':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1">
          <Paperclip className="h-3 w-3" /> Optional
        </Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Tasks</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center justify-between p-4 hover:bg-muted/30 cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="pt-1">{getStatusIcon(task.status)}</div>
                <div>
                  <h3 className="font-medium">{task.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span>Due: {task.dueDate}</span>
                    {getPriorityBadge(task.priority)}
                    {getAttachmentBadge(task.attachmentsRequired)}
                  </div>
                </div>
              </div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
                <AvatarFallback className="bg-gray-200 text-gray-700">{task.assignee.initials}</AvatarFallback>
              </Avatar>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
