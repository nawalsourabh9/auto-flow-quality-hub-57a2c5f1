
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface NewRevisionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fileName: string, version: string, notes: string) => void;
  documentTypeLabel: string;
  currentVersion: string;
}

const NewRevisionDialog: React.FC<NewRevisionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  documentTypeLabel,
  currentVersion,
}) => {
  const [newRevisionFile, setNewRevisionFile] = useState<File | null>(null);
  const [newRevisionVersion, setNewRevisionVersion] = useState('');
  const [newRevisionNotes, setNewRevisionNotes] = useState('');

  const handleSubmit = () => {
    if (!newRevisionFile || !newRevisionVersion) {
      toast({
        title: "Missing Information",
        description: "Please provide both file and version number",
        variant: "destructive"
      });
      return;
    }

    onSubmit(newRevisionFile.name, newRevisionVersion, newRevisionNotes);
    resetForm();
  };

  const resetForm = () => {
    setNewRevisionFile(null);
    setNewRevisionVersion('');
    setNewRevisionNotes('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        resetForm();
      }
    }}>
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
            <Input value={`v${currentVersion}`} disabled />
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
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Upload Revision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewRevisionDialog;
