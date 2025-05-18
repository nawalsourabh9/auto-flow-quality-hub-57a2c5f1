
import React from "react";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovalHierarchy } from "@/types/document";
import { DocumentApprovalFlow } from "@/components/documents/DocumentApprovalFlow";

interface ApprovalCardProps {
  approvalHierarchy: ApprovalHierarchy;
  teamMembers: Array<{
    id: string;
    name: string;
    position: string;
    initials: string;
  }>;
  canTakeAction: false | 'check' | 'approve';
  onReject: () => void;
  onApprove: () => void;
  rejectedBy?: string;
  rejectionReason?: string;
}

const ApprovalCard: React.FC<ApprovalCardProps> = ({
  approvalHierarchy,
  teamMembers,
  canTakeAction,
  onReject,
  onApprove,
  rejectedBy,
  rejectionReason,
}) => {
  // Helper function to get user details
  const getUserDisplayDetails = (userId: string | undefined) => {
    if (!userId) return { name: "Not Assigned", initials: "NA" };
    const member = teamMembers.find(m => m.id === userId);
    return member || { name: "Unknown User", initials: "??" };
  };

  return (
    <Card className="bg-muted/20">
      <CardContent className="p-4">
        <h3 className="text-sm font-medium mb-3">Approval Workflow</h3>
        <DocumentApprovalFlow 
          approvalHierarchy={approvalHierarchy}
          teamMembers={teamMembers}
        />
        
        {/* Rejection information */}
        {approvalHierarchy.status === 'rejected' && rejectedBy && (
          <div className="mt-4 p-3 bg-red-50 rounded border border-red-100">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Rejected by {getUserDisplayDetails(rejectedBy).name}</span>
            </div>
            {rejectionReason && (
              <p className="text-sm text-gray-700">{rejectionReason}</p>
            )}
          </div>
        )}
        
        {/* Action buttons */}
        {canTakeAction && approvalHierarchy.status !== 'approved' && approvalHierarchy.status !== 'rejected' && (
          <div className="flex justify-end gap-2 pt-3 border-t mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReject}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-1" /> Reject
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={onApprove}
            >
              <CheckCircle className="h-4 w-4 mr-1" /> 
              {canTakeAction === 'check' ? 'Check & Approve' : 'Approve'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApprovalCard;
