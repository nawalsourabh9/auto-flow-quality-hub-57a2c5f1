
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DocumentPermissions, DocumentType } from "@/types/document";
import { Edit, Check, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface UserPermissionsConfigProps {
  users: Array<{
    id: string;
    name: string;
    initials: string;
    position: string;
    department?: string;
  }>;
  documentTypes: DocumentType[];
  departments: Array<{
    id: string;
    name: string;
  }>;
  userPermissions: Record<string, DocumentPermissions>;
  onUpdatePermission: (userId: string, permissions: DocumentPermissions) => void;
}

export const UserPermissionsConfig: React.FC<UserPermissionsConfigProps> = ({
  users,
  documentTypes,
  departments,
  userPermissions,
  onUpdatePermission
}) => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<{
    id: string;
    name: string;
    initials: string;
    position: string;
    department?: string;
  } | null>(null);
  
  const [canInitiate, setCanInitiate] = React.useState(false);
  const [canCheck, setCanCheck] = React.useState(false);
  const [canApprove, setCanApprove] = React.useState(false);
  const [allowedDocTypes, setAllowedDocTypes] = React.useState<string[]>([]);
  const [allowedDepts, setAllowedDepts] = React.useState<string[]>([]);

  const handleEditPermissions = (user: typeof users[0]) => {
    setSelectedUser(user);
    const permissions = userPermissions[user.id] || {
      canInitiate: false,
      canCheck: false,
      canApprove: false,
      allowedDocumentTypes: [],
      allowedDepartments: []
    };
    
    setCanInitiate(permissions.canInitiate);
    setCanCheck(permissions.canCheck);
    setCanApprove(permissions.canApprove);
    setAllowedDocTypes(permissions.allowedDocumentTypes);
    setAllowedDepts(permissions.allowedDepartments);
    
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedUser) return;
    
    const updatedPermissions: DocumentPermissions = {
      canInitiate,
      canCheck,
      canApprove,
      allowedDocumentTypes: allowedDocTypes,
      allowedDepartments: allowedDepts
    };
    
    onUpdatePermission(selectedUser.id, updatedPermissions);
    setIsDialogOpen(false);
  };

  const handleDocTypeChange = (docTypeId: string, checked: boolean) => {
    if (checked) {
      setAllowedDocTypes(prev => [...prev, docTypeId]);
    } else {
      setAllowedDocTypes(prev => prev.filter(id => id !== docTypeId));
    }
  };

  const handleDeptChange = (deptId: string, checked: boolean) => {
    if (checked) {
      setAllowedDepts(prev => [...prev, deptId]);
    } else {
      setAllowedDepts(prev => prev.filter(id => id !== deptId));
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">User Document Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Can Initiate</TableHead>
                <TableHead>Can Check</TableHead>
                <TableHead>Can Approve</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => {
                const permissions = userPermissions[user.id] || {
                  canInitiate: false,
                  canCheck: false,
                  canApprove: false,
                  allowedDocumentTypes: [],
                  allowedDepartments: []
                };
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {user.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          {user.department && (
                            <div className="text-xs text-muted-foreground">{user.department}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.position}</TableCell>
                    <TableCell>
                      {permissions.canInitiate ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell>
                      {permissions.canCheck ? (
                        <Check className="h-5 w-5 text-amber-600" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell>
                      {permissions.canApprove ? (
                        <Check className="h-5 w-5 text-blue-600" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditPermissions(user)}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit Permissions
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              Edit Document Permissions for {selectedUser?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Permission Levels</Label>
              <div className="border rounded-md p-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="perm-initiate" 
                    checked={canInitiate}
                    onCheckedChange={(checked) => setCanInitiate(checked === true)}
                  />
                  <Label htmlFor="perm-initiate">Can initiate documents</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="perm-check" 
                    checked={canCheck}
                    onCheckedChange={(checked) => setCanCheck(checked === true)}
                  />
                  <Label htmlFor="perm-check">Can check documents</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="perm-approve" 
                    checked={canApprove}
                    onCheckedChange={(checked) => setCanApprove(checked === true)}
                  />
                  <Label htmlFor="perm-approve">Can approve documents</Label>
                </div>
              </div>
            </div>

            {canInitiate && (
              <>
                <div className="space-y-2">
                  <Label>Allowed Document Types</Label>
                  <div className="border rounded-md p-3 space-y-2">
                    {documentTypes.map(docType => (
                      <div key={docType.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`doctype-${docType.id}`} 
                          checked={allowedDocTypes.includes(docType.id)}
                          onCheckedChange={(checked) => handleDocTypeChange(docType.id, checked === true)}
                        />
                        <Label htmlFor={`doctype-${docType.id}`}>
                          <div>{docType.name}</div>
                          <div className="text-xs text-muted-foreground">{docType.description}</div>
                        </Label>
                      </div>
                    ))}
                    {documentTypes.length === 0 && (
                      <div className="text-sm text-muted-foreground">
                        No document types available. Create document types first.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Allowed Departments</Label>
                  <div className="border rounded-md p-3 space-y-2">
                    {departments.map(dept => (
                      <div key={dept.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`dept-${dept.id}`} 
                          checked={allowedDepts.includes(dept.id)}
                          onCheckedChange={(checked) => handleDeptChange(dept.id, checked === true)}
                        />
                        <Label htmlFor={`dept-${dept.id}`}>{dept.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {(canCheck || canApprove) && (
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-md">
                <p className="text-sm text-blue-700">
                  {`${selectedUser?.name} can ${canCheck ? 'check' : ''} ${canCheck && canApprove ? 'and' : ''} ${canApprove ? 'approve' : ''} documents when assigned specifically in a document's approval workflow.`}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
