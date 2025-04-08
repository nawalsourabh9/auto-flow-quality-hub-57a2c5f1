
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Database, PieChart, BookOpen } from "lucide-react";
import { ApprovalHierarchy, DocumentPermissions } from "@/types/document";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface DocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (documentType: 'sop' | 'dataFormat' | 'reportFormat' | 'rulesAndProcedures', file: File, version: string, notes: string, approvalHierarchy: ApprovalHierarchy) => void;
  documentType: 'sop' | 'dataFormat' | 'reportFormat' | 'rulesAndProcedures';
  currentUserId: string;
  currentUserPermissions: DocumentPermissions;
  teamMembers: Array<{
    id: string;
    name: string;
    position: string;
    initials: string;
    department?: string;
  }>;
  documentTypes: Array<{
    id: string;
    name: string;
    description: string;
    allowedDepartments: string[];
    requiredApprovalLevels: ('initiator' | 'checker' | 'approver')[];
  }>;
}

const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({
  isOpen,
  onClose,
  onUpload,
  documentType,
  currentUserId,
  currentUserPermissions,
  teamMembers,
  documentTypes
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState('');
  const [notes, setNotes] = useState('');
  const [checker, setChecker] = useState<string>('');
  const [approver, setApprover] = useState<string>('');
  const [showApprovalSettings, setShowApprovalSettings] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>('');

  const documentTypeLabels = {
    'sop': 'Standard Operating Procedure',
    'dataFormat': 'Data Recording Format',
    'reportFormat': 'Reporting Format',
    'rulesAndProcedures': 'Rules and Procedures'
  };

  const documentTypeIcons = {
    'sop': <FileText className="h-5 w-5 text-green-500" />,
    'dataFormat': <Database className="h-5 w-5 text-blue-500" />,
    'reportFormat': <PieChart className="h-5 w-5 text-amber-500" />,
    'rulesAndProcedures': <BookOpen className="h-5 w-5 text-purple-500" />
  };

  const handleUpload = () => {
    if (!file || !version) return;
    
    const docTypeConfig = documentTypes.find(dt => dt.id === selectedDocType);
    
    const approvalHierarchy: ApprovalHierarchy = {
      initiator: currentUserId,
      status: 'draft',
      initiatorApproved: true,
      initiatedAt: new Date().toISOString()
    };
    
    if (docTypeConfig?.requiredApprovalLevels.includes('checker') && checker) {
      approvalHierarchy.checker = checker;
      approvalHierarchy.status = 'pending-checker';
    }
    
    if (docTypeConfig?.requiredApprovalLevels.includes('approver') && approver) {
      approvalHierarchy.approver = approver;
    }
    
    onUpload(documentType, file, version, notes, approvalHierarchy);
    handleReset();
  };

  const handleReset = () => {
    setFile(null);
    setVersion('');
    setNotes('');
    setChecker('');
    setApprover('');
    setSelectedDocType('');
    setShowApprovalSettings(false);
    onClose();
  };

  const eligibleDocumentTypes = documentTypes.filter(dt => 
    currentUserPermissions.allowedDocumentTypes.includes(dt.id)
  );

  const eligibleCheckers = teamMembers.filter(member => 
    member.id !== currentUserId
  );
  
  const eligibleApprovers = teamMembers.filter(member => 
    member.id !== currentUserId && member.id !== checker
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {documentTypeIcons[documentType]}
            Upload New {documentTypeLabels[documentType]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Document Type Configuration</Label>
            <Select value={selectedDocType} onValueChange={setSelectedDocType}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type configuration" />
              </SelectTrigger>
              <SelectContent>
                {eligibleDocumentTypes.length > 0 ? (
                  eligibleDocumentTypes.map(dt => (
                    <SelectItem key={dt.id} value={dt.id}>
                      {dt.name}
                    </SelectItem>
                  ))
                ) : (
                  // This is what we need to fix - we can't have an empty value here
                  <SelectItem value="no-types-available">No document types available</SelectItem>
                )}
              </SelectContent>
            </Select>
            {selectedDocType && selectedDocType !== "no-types-available" && (
              <p className="text-xs text-muted-foreground mt-1">
                {documentTypes.find(dt => dt.id === selectedDocType)?.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Version Number</Label>
            <Input 
              placeholder="e.g., 1.0" 
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Document File</Label>
            <Input 
              type="file" 
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Add any notes about this document"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {selectedDocType && (
            <Collapsible
              open={showApprovalSettings}
              onOpenChange={setShowApprovalSettings}
              className="border rounded-md p-3"
            >
              <CollapsibleTrigger asChild>
                <div className="flex justify-between items-center cursor-pointer">
                  <h3 className="text-sm font-medium">Approval Workflow</h3>
                  <Button variant="ghost" size="sm">
                    {showApprovalSettings ? "Hide" : "Configure"}
                  </Button>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-3">
                <div className="space-y-1">
                  <Label>Initiator</Label>
                  <Input 
                    value={teamMembers.find(m => m.id === currentUserId)?.name || 'Current User'}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">You are the document initiator</p>
                </div>

                {documentTypes.find(dt => dt.id === selectedDocType)?.requiredApprovalLevels.includes('checker') && (
                  <div className="space-y-1">
                    <Label>Checker</Label>
                    <Select value={checker} onValueChange={setChecker}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select checker" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleCheckers.map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} - {member.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Person who will review the document before approval
                    </p>
                  </div>
                )}

                {documentTypes.find(dt => dt.id === selectedDocType)?.requiredApprovalLevels.includes('approver') && (
                  <div className="space-y-1">
                    <Label>Approver</Label>
                    <Select value={approver} onValueChange={setApprover}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select approver" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleApprovers.map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} - {member.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Person who will give final approval to the document
                    </p>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleUpload}
            disabled={!file || !version || !selectedDocType}
          >
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadDialog;
