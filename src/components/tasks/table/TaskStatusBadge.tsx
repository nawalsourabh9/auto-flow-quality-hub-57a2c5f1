
import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface TaskStatusBadgeProps {
  status: string;
  comments?: string;
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status, comments }) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 flex items-center gap-1"><Clock className="h-3 w-3" /> In Progress</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="bg-red-50 text-red-700 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Overdue</Badge>;
      case 'not-started':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 flex items-center gap-1">Not Started</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // If there are no comments, just return the badge
  if (!comments) {
    return getStatusBadge();
  }

  // If there are comments, wrap the badge in a tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {getStatusBadge()}
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px] whitespace-normal text-sm">
          <div className="font-semibold">Comments:</div>
          <div>{comments}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
