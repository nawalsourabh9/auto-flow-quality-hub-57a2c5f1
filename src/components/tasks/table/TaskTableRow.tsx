
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { Task, TeamMember } from "@/types/task";
import { TaskDocument } from "@/types/document";
import { formatDate } from "@/utils/dateUtils";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { TaskCustomerBadge } from "./TaskCustomerBadge";
import { TaskAttachmentBadge } from "./TaskAttachmentBadge";
import { TaskDocumentBadges } from "./TaskDocumentBadges";
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
  setViewingDocument: (data: { task: Task, document: TaskDocument } | null) => void;
}

const TaskTableRow: React.FC<TaskTableRowProps> = ({
  task,
  onViewTask,
  onEditTask,
  onDeleteTask,
  isAdmin,
  currentUserId,
  currentUserPermissions,
  teamMembers,
  setViewingDocument
}) => {
  const formatDateForDisplay = (dateString: string | undefined) => {
    if (!dateString) return "";
    try {
      return formatDate(dateString);
    } catch (error) {
      return dateString;
    }
  };  // Determine if this is an instance task (indented display)
  const isInstanceTask = !!task.parentTaskId;
  const isTemplate = task.isTemplate;
    // Build row className with enhanced template styling
  let rowClassName = "";
  if (isTemplate) {
    // Template rows: Light lavender background with purple accent and custom styling
    rowClassName = "template-row bg-gradient-to-r from-purple-50 via-lavender-50 to-indigo-50 border-l-4 border-l-purple-400 shadow-sm hover:from-purple-100 hover:via-purple-75 hover:to-indigo-100 transition-all duration-300 ease-in-out";
  } else if (isInstanceTask) {
    // Instance rows: Subtle blue tint with left border
    rowClassName = "bg-blue-50/30 border-l-4 border-l-blue-300 hover:bg-blue-50/50 transition-colors duration-200";
  } else {
    // Regular tasks: Standard hover effect
    rowClassName = "hover:bg-muted/50 transition-colors duration-200";
  }
  
  return (
    <TableRow className={rowClassName}>      <TableCell className="font-medium min-w-[250px]">
        <div className={`flex flex-col gap-2 ${isInstanceTask ? 'ml-4' : ''}`}>
          <div className="flex items-center gap-2">            {isTemplate && (
              <span className="template-badge px-2 py-1 text-xs font-semibold bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 rounded-full border border-purple-200 shadow-sm">
                ✨ TEMPLATE
              </span>
            )}            <span className={`${isInstanceTask ? 'text-sm text-muted-foreground' : ''} ${isTemplate ? 'font-semibold text-purple-900' : ''}`}>
              {task.title}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            <TaskRecurringBadge task={task} />
            <TaskCustomerBadge isCustomerRelated={task.isCustomerRelated} customerName={task.customerName} />
          </div>
        </div>
      </TableCell>      <TableCell className="min-w-[120px]">
        <div className="flex items-center gap-2">
          {task.assigneeDetails ? (
            <>
              <Avatar className={`h-6 w-6 ${isTemplate ? 'ring-2 ring-purple-200' : ''}`}>
                <AvatarFallback className={`text-xs ${isTemplate ? 'bg-purple-100 text-purple-700' : ''}`}>
                  {task.assigneeDetails.initials}
                </AvatarFallback>
              </Avatar>
              <span className={`text-sm ${isTemplate ? 'font-medium text-purple-800' : ''}`}>
                {task.assigneeDetails.name}
              </span>
            </>
          ) : (
            <span className={`text-sm text-muted-foreground ${isTemplate ? 'italic' : ''}`}>
              {isTemplate ? 'Template Assignee' : 'Unassigned'}
            </span>
          )}
        </div>
      </TableCell>      <TableCell className="min-w-[100px]">
        <span className={`text-sm ${isTemplate ? 'font-medium text-purple-800' : ''}`}>
          {task.department}
        </span>
      </TableCell>      <TableCell className="min-w-[120px]">
        <div className="flex flex-col gap-1">
          <span className={`text-sm ${isTemplate ? 'italic text-purple-600' : ''}`}>
            {isTemplate ? 'No due date (Template)' : formatDateForDisplay(task.dueDate)}
          </span>
          {isInstanceTask && task.startDate && (
            <span className="text-xs text-muted-foreground">
              Started: {formatDateForDisplay(task.startDate)}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="min-w-[80px]">
        <TaskPriorityBadge priority={task.priority} />
      </TableCell>
      <TableCell className="min-w-[120px]">
        <TaskStatusBadge status={task.status} comments={task.comments} isTemplate={task.isTemplate} />
      </TableCell>
      <TableCell className="min-w-[200px]">
        <div className="flex flex-wrap gap-1">
          <TaskDocumentBadges task={task} setViewingDocument={setViewingDocument} />
          <TaskAttachmentBadge attachmentsRequired={task.attachmentsRequired} />
        </div>
      </TableCell>
      <TableCell className="min-w-[200px]">
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onViewTask(task)}
            className="h-8 px-3"
          >
            <Eye className="h-3 w-3 mr-1" />
            Update
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onEditTask(task)}
            className="h-8 px-3"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          {(isAdmin || currentUserId === task.assignee) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteTask(task.id)}
              className="h-8 px-3 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default TaskTableRow;
