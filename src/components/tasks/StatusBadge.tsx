
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
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
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          Not Started
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status}
        </Badge>
      );
  }
};

export default StatusBadge;
