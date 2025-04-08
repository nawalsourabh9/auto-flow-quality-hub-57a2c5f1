
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentPermissions, DocumentType } from "@/types/document";
import { UserPermissionsConfig } from "@/components/documents/UserPermissionsConfig";
import { DocumentTypeConfig } from "@/components/documents/DocumentTypeConfig";
import { TaskApprovalSettings } from "@/components/admin/TaskApprovalSettings";
import { toast } from "sonner";

const Admin = () => {
  // Mock data for demonstration - in a real app, this would come from API
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([
    {
      id: "sop-manufacturing",
      name: "Manufacturing SOP",
      description: "Standard Operating Procedures for manufacturing processes",
      allowedDepartments: ["1", "2"], // department IDs
      requiredApprovalLevels: ["initiator", "checker", "approver"]
    },
    {
      id: "sop-quality",
      name: "Quality SOP",
      description: "Standard Operating Procedures for quality control processes",
      allowedDepartments: ["2"],
      requiredApprovalLevels: ["initiator", "checker", "approver"]
    }
  ]);

  const [departments, setDepartments] = useState([
    { id: "1", name: "Manufacturing" },
    { id: "2", name: "Quality" },
    { id: "3", name: "Regulatory" },
    { id: "4", name: "Management" }
  ]);

  const [teamMembers, setTeamMembers] = useState([
    { id: "user-1", name: "John Doe", position: "Manager", initials: "JD", department: "Manufacturing" },
    { id: "user-2", name: "Sarah Miller", position: "Engineer", initials: "SM", department: "Quality" },
    { id: "user-3", name: "Robert Johnson", position: "Specialist", initials: "RJ", department: "Regulatory" }
  ]);

  const [userPermissions, setUserPermissions] = useState<Record<string, DocumentPermissions>>({
    "user-1": {
      canInitiate: true,
      canCheck: true,
      canApprove: true,
      allowedDocumentTypes: ["sop-manufacturing", "sop-quality"],
      allowedDepartments: ["1", "2", "3", "4"]
    },
    "user-2": {
      canInitiate: true,
      canCheck: false,
      canApprove: false,
      allowedDocumentTypes: ["sop-quality"],
      allowedDepartments: ["2"]
    },
    "user-3": {
      canInitiate: false,
      canCheck: true,
      canApprove: true,
      allowedDocumentTypes: [],
      allowedDepartments: ["3"]
    }
  });

  const handleUpdatePermission = (userId: string, permissions: DocumentPermissions) => {
    setUserPermissions(prev => ({
      ...prev,
      [userId]: permissions
    }));
    toast({
      title: "Permissions Updated",
      description: `Updated permissions for user successfully`,
    });
  };

  const handleAddDocumentType = (docType: DocumentType) => {
    setDocumentTypes(prev => [...prev, docType]);
    toast({
      title: "Document Type Added",
      description: `Added ${docType.name} successfully`,
    });
  };

  const handleEditDocumentType = (docType: DocumentType) => {
    setDocumentTypes(prev => prev.map(dt => dt.id === docType.id ? docType : dt));
    toast({
      title: "Document Type Updated",
      description: `Updated ${docType.name} successfully`,
    });
  };

  const handleUpdateTaskApprovalSettings = (departmentId: string, settings: any) => {
    // In a real app, this would update the database
    toast({
      title: "Task Approval Settings Updated",
      description: `Updated task approval settings for ${
        departments.find(d => d.id === departmentId)?.name || 'department'
      }`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <p className="text-muted-foreground">
          Configure system-wide settings, permissions, and approval workflows
        </p>
      </div>

      <Tabs defaultValue="document-authority">
        <TabsList>
          <TabsTrigger value="document-authority">Document Authority</TabsTrigger>
          <TabsTrigger value="task-approval">Task Approval Workflow</TabsTrigger>
        </TabsList>
        
        <TabsContent value="document-authority" className="space-y-6 mt-6">
          <DocumentTypeConfig
            documentTypes={documentTypes}
            departments={departments}
            onAddDocumentType={handleAddDocumentType}
            onEditDocumentType={handleEditDocumentType}
          />

          <UserPermissionsConfig
            users={teamMembers}
            documentTypes={documentTypes}
            departments={departments}
            userPermissions={userPermissions}
            onUpdatePermission={handleUpdatePermission}
          />
        </TabsContent>
        
        <TabsContent value="task-approval" className="mt-6">
          <TaskApprovalSettings
            departments={departments}
            users={teamMembers}
            onUpdateSettings={handleUpdateTaskApprovalSettings}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
