
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DocumentType } from "@/types/document";
import { PlusCircle, Settings, Users } from "lucide-react";

interface DocumentTypeConfigProps {
  documentTypes: DocumentType[];
  departments: Array<{
    id: string;
    name: string;
  }>;
  onAddDocumentType: (documentType: DocumentType) => void;
  onEditDocumentType: (documentType: DocumentType) => void;
}

export const DocumentTypeConfig: React.FC<DocumentTypeConfigProps> = ({
  documentTypes,
  departments,
  onAddDocumentType,
  onEditDocumentType
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingDocType, setEditingDocType] = React.useState<DocumentType | null>(null);
  
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedDepartments, setSelectedDepartments] = React.useState<string[]>([]);
  const [requiredLevels, setRequiredLevels] = React.useState<('initiator' | 'checker' | 'approver')[]>(['initiator']);

  const handleAddOpen = () => {
    setName("");
    setDescription("");
    setSelectedDepartments([]);
    setRequiredLevels(['initiator']);
    setIsAddDialogOpen(true);
  };

  const handleEditOpen = (docType: DocumentType) => {
    setEditingDocType(docType);
    setName(docType.name);
    setDescription(docType.description);
    setSelectedDepartments([...docType.allowedDepartments]);
    setRequiredLevels([...docType.requiredApprovalLevels]);
    setIsEditDialogOpen(true);
  };

  const handleAdd = () => {
    if (!name) return;
    
    const newDocType: DocumentType = {
      id: `doctype-${Date.now()}`,
      name,
      description,
      allowedDepartments: selectedDepartments,
      requiredApprovalLevels: requiredLevels
    };
    
    onAddDocumentType(newDocType);
    setIsAddDialogOpen(false);
  };

  const handleEdit = () => {
    if (!editingDocType || !name) return;
    
    const updatedDocType: DocumentType = {
      ...editingDocType,
      name,
      description,
      allowedDepartments: selectedDepartments,
      requiredApprovalLevels: requiredLevels
    };
    
    onEditDocumentType(updatedDocType);
    setIsEditDialogOpen(false);
  };

  const handleDepartmentChange = (departmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDepartments(prev => [...prev, departmentId]);
    } else {
      setSelectedDepartments(prev => prev.filter(id => id !== departmentId));
    }
  };

  const handleLevelChange = (level: 'initiator' | 'checker' | 'approver', checked: boolean) => {
    if (level === 'initiator') return; // Initiator is always required
    
    if (checked) {
      setRequiredLevels(prev => [...prev, level]);
    } else {
      setRequiredLevels(prev => prev.filter(l => l !== level));
    }
  };

  const renderForm = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Document Type Name</Label>
        <Input 
          placeholder="e.g., ISO 9001 SOP" 
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea 
          placeholder="Description of this document type" 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Allowed Departments</Label>
        <div className="border rounded-md p-3 space-y-2">
          {departments.map(dept => (
            <div key={dept.id} className="flex items-center space-x-2">
              <Checkbox 
                id={`dept-${dept.id}`} 
                checked={selectedDepartments.includes(dept.id)}
                onCheckedChange={(checked) => handleDepartmentChange(dept.id, checked === true)}
              />
              <Label htmlFor={`dept-${dept.id}`}>{dept.name}</Label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Required Approval Levels</Label>
        <div className="border rounded-md p-3 space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="level-initiator" 
              checked={true}
              disabled
            />
            <Label htmlFor="level-initiator">Initiator (required)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="level-checker" 
              checked={requiredLevels.includes('checker')}
              onCheckedChange={(checked) => handleLevelChange('checker', checked === true)}
            />
            <Label htmlFor="level-checker">Checker</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="level-approver" 
              checked={requiredLevels.includes('approver')}
              onCheckedChange={(checked) => handleLevelChange('approver', checked === true)}
            />
            <Label htmlFor="level-approver">Approver</Label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Document Type Configurations</CardTitle>
          <Button onClick={handleAddOpen} size="sm">
            <PlusCircle className="h-4 w-4 mr-1" /> Add Type
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Allowed Departments</TableHead>
                <TableHead>Approval Levels</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentTypes.map(docType => (
                <TableRow key={docType.id}>
                  <TableCell className="font-medium">{docType.name}</TableCell>
                  <TableCell>{docType.description}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {docType.allowedDepartments.map(deptId => (
                        <Badge key={deptId} variant="outline" className="text-xs">
                          {departments.find(d => d.id === deptId)?.name || deptId}
                        </Badge>
                      ))}
                      {docType.allowedDepartments.length === 0 && (
                        <span className="text-muted-foreground text-xs">All departments</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {docType.requiredApprovalLevels.map(level => (
                        <Badge key={level} variant="outline" className="capitalize text-xs">
                          {level}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditOpen(docType)}
                    >
                      <Settings className="h-4 w-4 mr-1" /> Configure
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {documentTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No document types configured. Add your first document type to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Document Type</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleAdd}>
              Add Document Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Document Type</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
