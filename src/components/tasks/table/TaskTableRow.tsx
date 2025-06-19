
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
    // Get frequency-based colors for templates (using CSS variables for better compatibility)
  const getFrequencyColors = (frequency: string | undefined) => {
    switch (frequency) {
      case 'daily':
        return {
          bg: 'from-emerald-50 via-green-50 to-teal-50',
          border: 'border-l-emerald-500',
          hover: 'hover:from-emerald-100 hover:via-green-100 hover:to-teal-100',
          text: 'text-emerald-800',
          badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          style: { backgroundColor: 'rgb(236 253 245)', borderLeftColor: 'rgb(16 185 129)' }
        };
      case 'weekly':
        return {
          bg: 'from-blue-50 via-cyan-50 to-sky-50',
          border: 'border-l-blue-500',
          hover: 'hover:from-blue-100 hover:via-cyan-100 hover:to-sky-100',
          text: 'text-blue-800',
          badge: 'bg-blue-100 text-blue-700 border-blue-200',
          style: { backgroundColor: 'rgb(239 246 255)', borderLeftColor: 'rgb(59 130 246)' }
        };
      case 'bi-weekly':
        return {
          bg: 'from-indigo-50 via-purple-50 to-violet-50',
          border: 'border-l-indigo-500',
          hover: 'hover:from-indigo-100 hover:via-purple-100 hover:to-violet-100',
          text: 'text-indigo-800',
          badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
          style: { backgroundColor: 'rgb(238 242 255)', borderLeftColor: 'rgb(99 102 241)' }
        };
      case 'monthly':
        return {
          bg: 'from-amber-50 via-yellow-50 to-orange-50',
          border: 'border-l-amber-500',
          hover: 'hover:from-amber-100 hover:via-yellow-100 hover:to-orange-100',
          text: 'text-amber-800',
          badge: 'bg-amber-100 text-amber-700 border-amber-200',
          style: { backgroundColor: 'rgb(255 251 235)', borderLeftColor: 'rgb(245 158 11)' }
        };
      case 'quarterly':
        return {
          bg: 'from-rose-50 via-pink-50 to-red-50',
          border: 'border-l-rose-500',
          hover: 'hover:from-rose-100 hover:via-pink-100 hover:to-red-100',
          text: 'text-rose-800',
          badge: 'bg-rose-100 text-rose-700 border-rose-200',
          style: { backgroundColor: 'rgb(255 241 242)', borderLeftColor: 'rgb(244 63 94)' }
        };
      case 'annually':
        return {
          bg: 'from-purple-50 via-violet-50 to-fuchsia-50',
          border: 'border-l-purple-500',
          hover: 'hover:from-purple-100 hover:via-violet-100 hover:to-fuchsia-100',
          text: 'text-purple-800',
          badge: 'bg-purple-100 text-purple-700 border-purple-200',
          style: { backgroundColor: 'rgb(250 245 255)', borderLeftColor: 'rgb(168 85 247)' }
        };
      default:
        return {
          bg: 'from-gray-50 via-slate-50 to-zinc-50',
          border: 'border-l-gray-400',
          hover: 'hover:from-gray-100 hover:via-slate-100 hover:to-zinc-100',
          text: 'text-gray-800',
          badge: 'bg-gray-100 text-gray-700 border-gray-200',
          style: { backgroundColor: 'rgb(249 250 251)', borderLeftColor: 'rgb(156 163 175)' }
        };
    }
  };
  // Build row className with frequency-based coloring for templates
  let rowClassName = "";
  let rowStyle = {};
  if (isTemplate) {
    const colors = getFrequencyColors(task.recurringFrequency);
    rowClassName = `template-row border-l-4 shadow-sm transition-all duration-300 ease-in-out ${colors.border} ${colors.text}`;
    rowStyle = {
      ...colors.style,
      borderLeftWidth: '4px'
    };
    // Debug: Log to see if colors are being applied
    console.log('Template row colors for', task.recurringFrequency, ':', colors);
  } else if (isInstanceTask) {
    // Instance rows: Subtle blue tint with left border
    rowClassName = "bg-blue-50/30 border-l-4 border-l-blue-300 hover:bg-blue-50/50 transition-colors duration-200";
  } else {
    // Regular tasks: Standard hover effect
    rowClassName = "hover:bg-muted/50 transition-colors duration-200";
  }
  
  return (
    <TableRow className={rowClassName} style={rowStyle}>      <TableCell className="font-medium min-w-[250px]">
        <div className={`flex flex-col gap-2 ${isInstanceTask ? 'ml-4' : ''}`}>          <div className="flex items-center gap-2">            {isTemplate && (
              <span className={`template-badge px-2 py-1 text-xs font-semibold rounded-full border shadow-sm ${
                getFrequencyColors(task.recurringFrequency).badge
              }`}>
                ✨ TEMPLATE
              </span>
            )}            <span className={`${isInstanceTask ? 'text-sm text-muted-foreground' : ''} ${
              isTemplate ? `font-semibold ${getFrequencyColors(task.recurringFrequency).text}` : ''
            }`}>
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
              <Avatar className={`h-6 w-6 ${
                isTemplate ? `ring-2 ${getFrequencyColors(task.recurringFrequency).border.replace('border-l-', 'ring-')}` : ''
              }`}>
                <AvatarFallback className={`text-xs ${
                  isTemplate ? `${getFrequencyColors(task.recurringFrequency).badge}` : ''
                }`}>
                  {task.assigneeDetails.initials}
                </AvatarFallback>
              </Avatar>              <span className={`text-sm ${
                isTemplate ? `font-medium ${getFrequencyColors(task.recurringFrequency).text}` : ''
              }`}>
                {task.assigneeDetails.name}
              </span>
            </>
          ) : (
            <span className={`text-sm text-muted-foreground ${isTemplate ? 'italic' : ''}`}>
              {isTemplate ? 'Template Assignee' : 'Unassigned'}
            </span>
          )}
        </div>
      </TableCell>      <TableCell className="min-w-[100px]">        <span className={`text-sm ${
          isTemplate ? `font-medium ${getFrequencyColors(task.recurringFrequency).text}` : ''
        }`}>
          {task.department}
        </span>
      </TableCell>      <TableCell className="min-w-[120px]">
        <div className="flex flex-col gap-1">          <span className={`text-sm ${
            isTemplate ? `italic ${getFrequencyColors(task.recurringFrequency).text}` : ''
          }`}>
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
