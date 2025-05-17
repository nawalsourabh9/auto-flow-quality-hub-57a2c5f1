
import React from "react";
import { Badge } from "@/components/ui/badge";

interface TaskPriorityBadgeProps {
  priority: 'low' | 'medium' | 'high';
}

export const TaskPriorityBadge: React.FC<TaskPriorityBadgeProps> = ({ priority }) => {
  switch (priority) {
    case 'low':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700">Low</Badge>;
    case 'medium':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700">Medium</Badge>;
    case 'high':
      return <Badge variant="outline" className="bg-red-50 text-red-700">High</Badge>;
  }
};
