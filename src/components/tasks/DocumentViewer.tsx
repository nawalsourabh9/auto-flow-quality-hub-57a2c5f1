
import React, { useState } from "react";
import { TaskDocument } from "@/types/document";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, User, FileType, History, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Task } from "@/types/task";
import { DocumentPermissions } from "@/types/document";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DocumentApprovalFlow } from "@/components/documents/DocumentApprovalFlow";

interface DocumentViewerProps {
  task: {
    id: string;
    title: string;
    assigneeDetails?: {
      name: string;
    };
  };
  document: TaskDocument;
  onUpdateRevision?: (documentType: string, revisionId: string) => void;
  onAddNewRevision?: (documentType: string, fileName: string, version: string) => void;
  currentUserId?: string;
  currentUserPermissions?: DocumentPermissions;
  onUpdateApprovalStatus?: (action: 'initiate' | 'check' | 'approve' | 'reject', reason?: string) => void;
  teamMembers?: Array<{
    id: string;
    name: string;
    position: string;
    initials: string;
  }>;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  task, 
  document, 
  onUpdateRevision,
  onAddNewRevision,
  currentUserId,
  currentUserPermissions,
  onUpdateApprovalStatus,
  teamMembers = []
}) => {
  const [isNewRevisionDialogOpen, setIsNewRevisionDialogOpen] = useState(false);
  const [newRevisionFile, setNewRevisionFile] = useState<File | null>(null);
  const [newRevisionVersion, setNewRevisionVersion] = useState('');
  const [newRevisionNotes, setNewRevisionNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  
  // Find the current revision or use the latest one
  const currentRevision = document.currentRevisionId
    ? document.revisions.find(rev => rev.id === document.currentRevisionId)
    : document.revisions.length > 0
      ? document.revisions[document.revisions.length - 1]
      : null;

  const documentTypeLabel = {
    'sop': 'Standard Operating Procedure',
    'dataFormat': 'Data Recording Format',
    'reportFormat': 'Reporting Format'
  }[document.documentType];

  if (!currentRevision) {
    return (
      <div className="text-center py-8 text-gray-500">
        No document revisions available
      </div>
    );
  }

  const handleNewRevisionSubmit = () => {
    if (!newRevisionFile || !newRevisionVersion) {
      toast({
        title: "Missing Information",
        description: "Please provide both file and version number",
        variant: "destructive"
      });
      return;
    }

    if (onAddNewRevision) {
      onAddNewRevision(document.documentType, newRevisionFile.name, newRevisionVersion);
      setIsNewRevisionDialogOpen(false);
      setNewRevisionFile(null);
      setNewRevisionVersion('');
      setNewRevisionNotes('');
    }
  };

  const handleSetCurrentRevision = (revisionId: string) => {
    if (onUpdateRevision) {
      onUpdateRevision(document.documentType, revisionId);
    }
  };

  // Determine if current user can take action on this document
  const canTakeAction = () => {
    if (!document.approvalHierarchy || !currentUserId || !currentUserPermissions) return false;
    const hierarchy = document.approvalHierarchy;
    
    // Check if user can check the document
    if (hierarchy.status === 'pending-checker' && 
        hierarchy.checker === currentUserId && 
        currentUserPermissions.canCheck) {
      return 'check';
    }
    
    // Check if user can approve the document
    if (hierarchy.status === 'pending-approval' && 
        hierarchy.approver === currentUserId && 
        currentUserPermissions.canApprove) {
      return 'approve';
    }
    
    return false;
  };

  const getApprovalStatusBadge = () => {
    const status = document.approvalHierarchy?.status;
    if (!status) return null;
    
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700">Draft</Badge>;
      case 'pending-checker':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 flex items-center gap-1"><Clock className="h-3 w-3" /> Pending Check</Badge>;
      case 'pending-approval':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 flex items-center gap-1"><Clock className="h-3 w-3" /> Pending Approval</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      default:
        return null;
    }
  };
  
  const getUserDisplayDetails = (userId: string | undefined) => {
    if (!userId) return { name: "Not Assigned", initials: "NA" };
    const member = teamMembers.find(m => m.id === userId);
    return member || { name: "Unknown User", initials: "??" };
  };

  // For this demo, we don't have actual document content to display
  // In a real application, you would fetch and render the document content here
  return (
    <div className="space-y-4">
      <div className="bg-muted/30 p-3 rounded-md">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">{task.title}</h3>
            <p className="text-sm text-muted-foreground">
              Assigned to: {task.assigneeDetails?.name || "Unassigned"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {documentTypeLabel}
            </Badge>
            {getApprovalStatusBadge()}
            {onAddNewRevision && document.approvalHierarchy?.status === 'approved' && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsNewRevisionDialogOpen(true)}
                className="flex items-center gap-1"
              >
                <History className="h-4 w-4" /> New Revision
              </Button>
            )}
          </div>
        </div>
      </div>

      {document.approvalHierarchy && (
        <Card className="bg-muted/20">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3">Approval Workflow</h3>
            <DocumentApprovalFlow 
              approvalHierarchy={document.approvalHierarchy}
              teamMembers={teamMembers}
            />
            
            {/* Rejection information */}
            {document.approvalHierarchy.status === 'rejected' && document.approvalHierarchy.rejectedBy && (
              <div className="mt-4 p-3 bg-red-50 rounded border border-red-100">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Rejected by {getUserDisplayDetails(document.approvalHierarchy.rejectedBy).name}</span>
                </div>
                {document.approvalHierarchy.rejectionReason && (
                  <p className="text-sm text-gray-700">{document.approvalHierarchy.rejectionReason}</p>
                )}
              </div>
            )}
            
            {/* Action buttons */}
            {canTakeAction() && document.approvalHierarchy.status !== 'approved' && document.approvalHierarchy.status !== 'rejected' && onUpdateApprovalStatus && (
              <div className="flex justify-end gap-2 pt-3 border-t mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsRejectDialogOpen(true)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => {
                    if (canTakeAction() === 'check') {
                      onUpdateApprovalStatus('check');
                    } else if (canTakeAction() === 'approve') {
                      onUpdateApprovalStatus('approve');
                    }
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> 
                  {canTakeAction() === 'check' ? 'Check & Approve' : 'Approve'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="document" className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="document">Document Content</TabsTrigger>
          <TabsTrigger value="info">Document Information</TabsTrigger>
        </TabsList>
        <TabsContent value="document" className="p-4 border rounded-md mt-2">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="font-medium">{currentRevision.fileName}</span>
              <Badge variant="outline">v{currentRevision.version}</Badge>
            </div>
            {document.approvalHierarchy?.status === 'approved' && (
              <Button size="sm" variant="outline" className="flex items-center gap-1">
                <Download className="h-4 w-4" /> Download
              </Button>
            )}
          </div>
          <Separator className="my-4" />
          
          {/* This would normally display the actual document content */}
          <div className="bg-gray-50 border border-dashed p-8 rounded text-center">
            <div className="mb-4 text-sm text-muted-foreground">Document Preview</div>
            
            {document.documentType === 'sop' && (
              <div className="space-y-4 text-left">
                <h2 className="text-xl font-bold">Standard Operating Procedure</h2>
                <p className="text-sm">
                  This document provides step-by-step instructions for completing the task: <strong>{task.title}</strong>
                </p>
                <h3 className="font-medium">Procedure Steps:</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Prepare the necessary equipment and materials</li>
                  <li>Conduct initial inspection according to quality guidelines</li>
                  <li>Record measurements in the data recording sheet</li>
                  <li>Analyze results against acceptance criteria</li>
                  <li>Document any deviations or non-conformances</li>
                  <li>Complete the task report using the reporting format</li>
                </ol>
              </div>
            )}
            
            {document.documentType === 'dataFormat' && (
              <div className="space-y-4 text-left">
                <h2 className="text-xl font-bold">Data Recording Format</h2>
                <p className="text-sm">
                  Use this format to record data for task: <strong>{task.title}</strong>
                </p>
                <table className="border w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">Parameter</th>
                      <th className="border p-2">Specification</th>
                      <th className="border p-2">Measured Value</th>
                      <th className="border p-2">Pass/Fail</th>
                      <th className="border p-2">Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map(i => (
                      <tr key={i}>
                        <td className="border p-2">Parameter {i}</td>
                        <td className="border p-2">Value between X-Y</td>
                        <td className="border p-2"></td>
                        <td className="border p-2"></td>
                        <td className="border p-2"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {document.documentType === 'reportFormat' && (
              <div className="space-y-4 text-left">
                <h2 className="text-xl font-bold">Reporting Format</h2>
                <p className="text-sm">
                  Complete this report after finishing task: <strong>{task.title}</strong>
                </p>
                <div className="border p-4 rounded space-y-3">
                  <div>
                    <label className="text-sm font-medium block">Task Summary:</label>
                    <div className="h-8 bg-white border rounded mt-1"></div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block">Findings:</label>
                    <div className="h-20 bg-white border rounded mt-1"></div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block">Recommendations:</label>
                    <div className="h-12 bg-white border rounded mt-1"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block">Completed By:</label>
                      <div className="h-8 bg-white border rounded mt-1"></div>
                    </div>
                    <div>
                      <label className="text-sm font-medium block">Date:</label>
                      <div className="h-8 bg-white border rounded mt-1"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="info" className="p-4 border rounded-md mt-2">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <FileType className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">File Name</p>
                <p className="text-sm text-muted-foreground">{currentRevision.fileName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline">v{currentRevision.version}</Badge>
              <div>
                <p className="text-sm font-medium">Version</p>
                <p className="text-sm text-muted-foreground">
                  {document.revisions.length > 1 ? 
                    `${document.revisions.indexOf(currentRevision) + 1} of ${document.revisions.length}` : 
                    'Initial version'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Upload Date</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(currentRevision.uploadDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Uploaded By</p>
                <p className="text-sm text-muted-foreground">{currentRevision.uploadedBy}</p>
              </div>
            </div>
            
            {currentRevision.notes && (
              <div>
                <p className="text-sm font-medium">Revision Notes</p>
                <p className="text-sm text-muted-foreground p-2 bg-gray-50 rounded border mt-1">
                  {currentRevision.notes}
                </p>
              </div>
            )}
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Revision History</h3>
              <div className="border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2">Version</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">User</th>
                      <th className="text-left p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {document.revisions.map((rev) => (
                      <tr key={rev.id} className={rev.id === currentRevision.id ? "bg-blue-50" : ""}>
                        <td className="p-2">v{rev.version}</td>
                        <td className="p-2">{new Date(rev.uploadDate).toLocaleDateString()}</td>
                        <td className="p-2">{rev.uploadedBy}</td>
                        <td className="p-2">
                          {rev.id !== currentRevision.id && onUpdateRevision ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2"
                              onClick={() => handleSetCurrentRevision(rev.id)}
                            >
                              Set Current
                            </Button>
                          ) : (
                            <span className="text-xs flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" /> Current
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isNewRevisionDialogOpen} onOpenChange={setIsNewRevisionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload New Document Revision</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Type</label>
              <Input value={documentTypeLabel} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Version</label>
              <Input value={`v${currentRevision.version}`} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Version Number</label>
              <Input 
                placeholder="e.g., 1.2" 
                value={newRevisionVersion} 
                onChange={(e) => setNewRevisionVersion(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload File</label>
              <Input 
                type="file" 
                onChange={(e) => e.target.files && setNewRevisionFile(e.target.files[0])} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Revision Notes</label>
              <Input 
                placeholder="What changed in this revision" 
                value={newRevisionNotes} 
                onChange={(e) => setNewRevisionNotes(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewRevisionDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleNewRevisionSubmit}>
              Upload Revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Document</label>
              <Input value={`${documentTypeLabel} - ${currentRevision.fileName}`} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Rejection Reason</label>
              <Textarea 
                placeholder="Please provide a reason for rejection" 
                value={rejectReason} 
                onChange={(e) => setRejectReason(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              onClick={() => {
                if (onUpdateApprovalStatus) {
                  onUpdateApprovalStatus('reject', rejectReason);
                  setIsRejectDialogOpen(false);
                  setRejectReason('');
                }
              }}
            >
              Reject Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentViewer;
