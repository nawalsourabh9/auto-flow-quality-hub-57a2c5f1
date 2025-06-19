
import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, HelpCircle, Settings } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface TaskStatusBadgeProps {
  status: string | null;
  comments?: string;
  isTemplate?: boolean;
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status, comments, isTemplate }) => {
  const getStatusBadge = () => {
    // Handle templates (null status)
    if (status === null || isTemplate) {
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
          <Settings className="h-3 w-3" /> Template
        </Badge>
      );
    }

    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Completed
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 flex items-center gap-1">
            <Clock className="h-3 w-3" /> In Progress
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Overdue
          </Badge>
        );
      case 'not-started':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 flex items-center gap-1">
            <HelpCircle className="h-3 w-3" /> Not Started
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // If there are no comments, just return the badge
  if (!comments || comments.trim() === '') {
    return getStatusBadge();
  }

  // If there are comments, wrap the badge in a tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center cursor-help">
            {getStatusBadge()}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[300px] p-3 bg-white border shadow-lg rounded-md">
          <p className="font-semibold mb-1">Status Comments:</p>
          <p className="text-sm">{comments}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
