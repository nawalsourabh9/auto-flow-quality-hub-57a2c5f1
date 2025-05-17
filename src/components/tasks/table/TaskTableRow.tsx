
import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2, RefreshCw } from "lucide-react";
import { Task } from "@/types/task";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import { TaskAttachmentBadge } from "./TaskAttachmentBadge";
import { TaskCustomerBadge } from "./TaskCustomerBadge";
import { TaskDocumentBadges } from "./TaskDocumentBadges";
import { format } from "date-fns";

interface TaskTableRowProps {
  task: Task;
  onViewTask: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  isAdmin?: boolean;
  setViewingDocument: (data: { task: Task, document: any } | null) => void;
}

const TaskTableRow: React.FC<TaskTableRowProps> = ({
  task,
  onViewTask,
  onEditTask,
  onDeleteTask,
  isAdmin,
  setViewingDocument
}) => {
  // Format the due date to DD-MM-YYYY if it exists
  const formattedDueDate = task.dueDate ? 
    format(new Date(task.dueDate), 'dd-MM-yyyy') : '';

  return (
    <tr className={`border-b hover:bg-muted/50 ${task.isCustomerRelated ? 'bg-green-50/50' : ''}`}>
      <td className="px-4 py-3 border-r">
        <div>
          <p className="font-medium flex items-center gap-2">
            {task.title}
            <TaskCustomerBadge 
              isCustomerRelated={task.isCustomerRelated} 
              customerName={task.customerName} 
            />
          </p>
          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
            {task.description}
          </p>
        </div>
      </td>
      <td className="px-4 py-3 border-r">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={task.assigneeDetails?.avatar} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {task.assigneeDetails?.initials || "UN"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{task.assigneeDetails?.name || "Unassigned"}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm border-r">{task.department}</td>
      <td className="px-4 py-3 text-sm border-r whitespace-nowrap">{formattedDueDate}</td>
      <td className="px-4 py-3 border-r"><TaskPriorityBadge priority={task.priority} /></td>
      <td className="px-4 py-3 border-r"><TaskStatusBadge status={task.status} comments={task.comments} /></td>
      <td className="px-4 py-3 border-r">
        <div className="flex flex-wrap gap-1">
          <TaskAttachmentBadge attachmentsRequired={task.attachmentsRequired} />
          <TaskDocumentBadges 
            task={task} 
            setViewingDocument={setViewingDocument}
          />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={() => onViewTask(task)} className="text-xs py-1 h-7">
            <RefreshCw className="h-3 w-3 mr-1" />
            Update
          </Button>
          {onEditTask && (
            <Button size="sm" variant="outline" onClick={() => onEditTask(task)} className="text-xs py-1 h-7">
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
          {onDeleteTask && (
            <Button 
              size="sm" 
              variant="outline" 
              className="text-red-600 hover:bg-red-50 text-xs py-1 h-7"
              onClick={() => onDeleteTask(task.id)}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default TaskTableRow;
