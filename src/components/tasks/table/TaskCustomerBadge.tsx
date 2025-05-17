
import React from "react";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

interface TaskCustomerBadgeProps {
  isCustomerRelated?: boolean;
  customerName?: string;
}

export const TaskCustomerBadge: React.FC<TaskCustomerBadgeProps> = ({ isCustomerRelated, customerName }) => {
  if (!isCustomerRelated) return null;
  
  return (
    <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 flex items-center gap-1">
      <User className="h-3 w-3" /> {customerName || 'Customer'}
    </Badge>
  );
};
