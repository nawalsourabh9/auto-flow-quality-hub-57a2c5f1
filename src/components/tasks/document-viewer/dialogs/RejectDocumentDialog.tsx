
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface RejectDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  documentName: string;
  documentTypeLabel: string;
}

const RejectDocumentDialog: React.FC<RejectDocumentDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  documentName,
  documentTypeLabel,
}) => {
  const [rejectReason, setRejectReason] = useState('');

  const handleSubmit = () => {
    onSubmit(rejectReason);
    setRejectReason('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        setRejectReason('');
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reject Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Document</label>
            <Input value={`${documentTypeLabel} - ${documentName}`} disabled />
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
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="destructive"
            onClick={handleSubmit}
          >
            Reject Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RejectDocumentDialog;
