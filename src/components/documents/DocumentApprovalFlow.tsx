
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, Clock } from "lucide-react";
import { ApprovalHierarchy } from "@/types/document";

interface DocumentApprovalFlowProps {
  approvalHierarchy: ApprovalHierarchy;
  teamMembers: Array<{
    id: string;
    name: string;
    position: string;
    initials: string;
  }>;
  compact?: boolean;
}

export const DocumentApprovalFlow: React.FC<DocumentApprovalFlowProps> = ({ 
  approvalHierarchy,
  teamMembers,
  compact = false
}) => {
  const getUserDisplayDetails = (userId: string | undefined) => {
    if (!userId) return { name: "Not Assigned", initials: "NA" };
    const member = teamMembers.find(m => m.id === userId);
    return member || { name: "Unknown User", initials: "??" };
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {approvalHierarchy.initiatorApproved && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
            Initiated
          </Badge>
        )}
        
        {approvalHierarchy.checker && (
          approvalHierarchy.checkerApproved ? (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs">
              Checked
            </Badge>
          ) : approvalHierarchy.status === 'pending-checker' ? (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs flex items-center gap-1">
              <Clock className="h-2 w-2" /> Checking
            </Badge>
          ) : null
        )}
        
        {approvalHierarchy.approver && (
          approvalHierarchy.approverApproved ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
              Approved
            </Badge>
          ) : approvalHierarchy.status === 'pending-approval' ? (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs flex items-center gap-1">
              <Clock className="h-2 w-2" /> Approving
            </Badge>
          ) : null
        )}
        
        {approvalHierarchy.status === 'rejected' && (
          <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">
            Rejected
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Initiator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">Initiator</Badge>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {getUserDisplayDetails(approvalHierarchy.initiator).initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{getUserDisplayDetails(approvalHierarchy.initiator).name}</span>
          </div>
        </div>
        <div>
          {approvalHierarchy.initiatorApproved ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Initiated
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-100 text-gray-700">Pending</Badge>
          )}
        </div>
      </div>
      
      {/* Checker */}
      {approvalHierarchy.checker && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-50 text-amber-700">Checker</Badge>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {getUserDisplayDetails(approvalHierarchy.checker).initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{getUserDisplayDetails(approvalHierarchy.checker).name}</span>
            </div>
          </div>
          <div>
            {approvalHierarchy.checkerApproved ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Checked
              </Badge>
            ) : approvalHierarchy.status === 'pending-checker' || 
               approvalHierarchy.status === 'pending-approval' || 
               approvalHierarchy.status === 'approved' ? (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Pending
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-100 text-gray-700">Not Started</Badge>
            )}
          </div>
        </div>
      )}
      
      {/* Approver */}
      {approvalHierarchy.approver && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700">Approver</Badge>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {getUserDisplayDetails(approvalHierarchy.approver).initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{getUserDisplayDetails(approvalHierarchy.approver).name}</span>
            </div>
          </div>
          <div>
            {approvalHierarchy.approverApproved ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Approved
              </Badge>
            ) : approvalHierarchy.status === 'pending-approval' ? (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Pending
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-100 text-gray-700">Not Started</Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
