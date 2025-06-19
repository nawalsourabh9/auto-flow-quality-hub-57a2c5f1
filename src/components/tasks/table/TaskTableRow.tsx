
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
  };

  const isTemplate = task.isTemplate;

  // Get frequency-based colors for templates
  const getFrequencyColors = (frequency: string | undefined) => {
    switch (frequency) {
      case 'daily':
        return {
          style: { backgroundColor: 'rgb(236 253 245)', borderLeftColor: 'rgb(16 185 129)' }
        };
      case 'weekly':
        return {
          style: { backgroundColor: 'rgb(239 246 255)', borderLeftColor: 'rgb(59 130 246)' }
        };
      case 'bi-weekly':
        return {
          style: { backgroundColor: 'rgb(238 242 255)', borderLeftColor: 'rgb(99 102 241)' }
        };
      case 'monthly':
        return {
          style: { backgroundColor: 'rgb(255 251 235)', borderLeftColor: 'rgb(245 158 11)' }
        };
      case 'quarterly':
        return {
          style: { backgroundColor: 'rgb(255 241 242)', borderLeftColor: 'rgb(244 63 94)' }
        };
      case 'annually':
        return {
          style: { backgroundColor: 'rgb(250 245 255)', borderLeftColor: 'rgb(168 85 247)' }
        };
      default:
        return {
          style: { backgroundColor: 'rgb(249 250 251)', borderLeftColor: 'rgb(156 163 175)' }
        };
    }
  };

  // Build row className and style
  let rowClassName = "hover:bg-muted/50 transition-colors duration-200";
  let rowStyle = {};
  
  if (isTemplate) {
    const colors = getFrequencyColors(task.recurringFrequency);
    rowClassName = "template-row border-l-4 shadow-sm transition-all duration-300 ease-in-out";
    rowStyle = {
      ...colors.style,
      borderLeftWidth: '4px'
    };
  }
  
  return (
    <TableRow className={rowClassName} style={rowStyle}>      <TableCell className="font-medium min-w-[250px] pl-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className={isTemplate ? 'font-semibold' : ''}>
              {task.title}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            <TaskRecurringBadge task={task} />
            <TaskCustomerBadge isCustomerRelated={task.isCustomerRelated} customerName={task.customerName} />
          </div>
        </div>
      </TableCell>      <TableCell className="min-w-[120px] pl-3">
        <div className="flex items-center gap-2">
          {task.assigneeDetails ? (
            <>
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {task.assigneeDetails.initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">
                {task.assigneeDetails.name}
              </span>
            </>
          ) : (
            <span className={`text-sm text-muted-foreground ${isTemplate ? 'italic' : ''}`}>
              {isTemplate ? 'Template Assignee' : 'Unassigned'}
            </span>
          )}
        </div>
      </TableCell>      <TableCell className="min-w-[100px] pl-3">
        <span className="text-sm">
          {task.department}
        </span>
      </TableCell>      <TableCell className="min-w-[120px] pl-3">
        <div className="flex flex-col gap-1">
          <span className={`text-sm ${isTemplate ? 'italic' : ''}`}>
            {isTemplate ? 'No due date (Template)' : formatDateForDisplay(task.dueDate)}
          </span>
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
