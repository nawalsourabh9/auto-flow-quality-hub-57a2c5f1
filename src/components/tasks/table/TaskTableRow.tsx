
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { Task, TeamMember } from "@/types/task";
import { formatDate } from "@/utils/dateUtils";
import TaskPriorityBadge from "./TaskPriorityBadge";
import TaskStatusBadge from "./TaskStatusBadge";
import TaskCustomerBadge from "./TaskCustomerBadge";
import TaskAttachmentBadge from "./TaskAttachmentBadge";
import TaskDocumentBadges from "./TaskDocumentBadges";
import TaskRecurringBadge from "./TaskRecurringBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TaskTableRowProps {
  task: Task;
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  isAdmin: boolean;
  currentUserId: string | undefined;
  currentUserPermissions: any;
  teamMembers: TeamMember[];
}

const TaskTableRow: React.FC<TaskTableRowProps> = ({
  task,
  onViewTask,
  onEditTask,
  onDeleteTask,
  isAdmin,
  currentUserId,
  currentUserPermissions,
  teamMembers
}) => {
  const formatDateForDisplay = (dateString: string | undefined) => {
    if (!dateString) return "";
    try {
      return formatDate(dateString);
    } catch (error) {
      return dateString;
    }
  };

  // Determine if this is an instance task (indented display)
  const isInstanceTask = !!task.parentTaskId;
  
  return (
    <TableRow 
      className={`hover:bg-muted/50 ${isInstanceTask ? 'bg-muted/20 border-l-4 border-l-blue-200' : ''}`}
    >
      <TableCell className="font-medium">
        <div className={`flex flex-col gap-2 ${isInstanceTask ? 'ml-4' : ''}`}>
          <div className="flex items-center gap-2">
            <span className={isInstanceTask ? 'text-sm text-muted-foreground' : ''}>
              {task.title}
            </span>
            {task.originalTaskName && isInstanceTask && (
              <span className="text-xs text-muted-foreground">
                (from "{task.originalTaskName}")
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            <TaskRecurringBadge task={task} />
            <TaskCustomerBadge task={task} />
            <TaskAttachmentBadge task={task} />
            <TaskDocumentBadges task={task} />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm">{task.department}</span>
      </TableCell>
      <TableCell>
        <TaskPriorityBadge priority={task.priority} />
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span className="text-sm">{formatDateForDisplay(task.dueDate)}</span>
          {isInstanceTask && task.startDate && (
            <span className="text-xs text-muted-foreground">
              Started: {formatDateForDisplay(task.startDate)}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {task.assigneeDetails ? (
            <>
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {task.assigneeDetails.initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{task.assigneeDetails.name}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Unassigned</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <TaskStatusBadge status={task.status} />
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewTask(task)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditTask(task)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            {(isAdmin || currentUserId === task.assignee) && (
              <DropdownMenuItem
                onClick={() => onDeleteTask(task.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default TaskTableRow;
