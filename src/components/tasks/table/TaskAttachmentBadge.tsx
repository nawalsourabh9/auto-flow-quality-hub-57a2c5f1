
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Paperclip } from "lucide-react";

interface TaskAttachmentBadgeProps {
  attachmentsRequired: 'none' | 'optional' | 'required';
}

export const TaskAttachmentBadge: React.FC<TaskAttachmentBadgeProps> = ({ attachmentsRequired }) => {
  switch (attachmentsRequired) {
    case 'required':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 flex items-center gap-1"><Paperclip className="h-3 w-3" /> Required</Badge>;
    case 'optional':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 flex items-center gap-1"><Paperclip className="h-3 w-3" /> Optional</Badge>;
    default:
      return null;
  }
};
