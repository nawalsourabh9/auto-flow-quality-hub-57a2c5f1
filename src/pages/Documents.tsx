import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, FileText, Database, PieChart, FileUp, History, CheckCircle, User, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { DocumentRevision, TaskDocument, ApprovalHierarchy } from "@/types/document";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSearchParams } from "react-router-dom";
import TasksTable from "@/components/tasks/TaskTable";
import StatusBadge from "@/components/tasks/StatusBadge";
import PriorityBadge from "@/components/tasks/PriorityBadge";
import { Task } from "@/types/task";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import DocumentUploadDialog from "@/components/documents/DocumentUploadDialog";
import { useQuery } from "@tanstack/react-query";
import { UserPermissionsConfig } from "@/components/documents/UserPermissionsConfig";

// Sample document data
const sampleDocuments: TaskDocument[] = [
  {
    id: "1",
    taskId: "1",
    taskTitle: "Review Process Flow Diagram for Assembly Line 3",
    documentType: "sop",
    fileName: "SOP-AssemblyLine3.pdf",
    version: "1.0",
    uploadDate: "2025-04-05",
    uploadedBy: "JD",
    department: "Engineering",
    isCustomerRelated: false,
    revisionCount: 2,
    task: {
      id: "1",
      title: "Review Process Flow Diagram for Assembly Line 3",
      description: "Analyze and update the process flow for improved efficiency",
      department: "Engineering",
      assignee: "JD",
      priority: "high",
      dueDate: "2025-04-15",
      status: "in-progress",
      createdAt: "2025-04-01",
      isRecurring: false,
      attachmentsRequired: "required"
    },
    document: {
      id: "1",
      fileName: "SOP-AssemblyLine3.pdf",
      fileType: "pdf",
      version: "1.0",
      documentType: "sop",
      uploadDate: "2025-04-05",
      uploadedBy: "John Doe",
      notes: "Initial version of the SOP",
      approvalHierarchy: {
        initiator: "JD",
        status: "approved",
        approver: "AD",
        approvedAt: "2025-04-10"
      }
    }
  },
  {
    id: "2",
    taskId: "2",
    taskTitle: "Quality Audit - Supplier ABC",
    documentType: "dataFormat",
    fileName: "DataFormat-SupplierABC.xlsx",
    version: "2.0",
    uploadDate: "2025-04-10",
    uploadedBy: "SM",
    department: "Quality",
    isCustomerRelated: false,
    revisionCount: 3,
    task: {
      id: "2",
      title: "Quality Audit - Supplier ABC",
      description: "Conduct quality audit for new supplier components",
      department: "Quality",
      assignee: "SM",
      priority: "medium",
      dueDate: "2025-04-20",
      status: "not-started",
      createdAt: "2025-04-02",
      isRecurring: false,
      attachmentsRequired: "optional"
    },
    document: {
      id: "2",
      fileName: "DataFormat-SupplierABC.xlsx",
      fileType: "xlsx",
      version: "2.0",
      documentType: "dataFormat",
      uploadDate: "2025-04-10",
      uploadedBy: "Sarah Miller",
      notes: "Updated format for capturing audit data",
      approvalHierarchy: {
        initiator: "SM",
        status: "pending-approval",
        checker: "RJ"
      }
    }
  },
  {
    id: "3",
    taskId: "3",
    taskTitle: "Update Customer Complaint Documentation",
    documentType: "reportFormat",
    fileName: "ReportFormat-CustomerComplaints.docx",
    version: "1.5",
    uploadDate: "2025-04-15",
    uploadedBy: "RJ",
    department: "Quality",
    isCustomerRelated: true,
    revisionCount: 1,
    task: {
      id: "3",
      title: "Update Customer Complaint Documentation",
      description: "Review and update the customer complaint handling procedure",
      department: "Quality",
      assignee: "RJ",
      priority: "high",
      dueDate: "2025-04-08",
      status: "overdue",
      createdAt: "2025-03-25",
      isRecurring: false,
      attachmentsRequired: "required"
    },
    document: {
      id: "3",
      fileName: "ReportFormat-CustomerComplaints.docx",
      fileType: "docx",
      version: "1.5",
      documentType: "reportFormat",
      uploadDate: "2025-04-15",
      uploadedBy: "Robert Johnson",
      notes: "Revised report format to include customer feedback analysis",
      approvalHierarchy: {
        initiator: "RJ",
        status: "approved",
        approver: "AD",
        approvedAt: "2025-04-20"
      }
    }
  }
];

const documentTypeLabels = {
  'sop': 'Standard Operating Procedure',
  'dataFormat': 'Data Recording Format',
  'reportFormat': 'Reporting Format',
  'rulesAndProcedures': 'Rules and Procedures'
};

const Documents = () => {
  const [documents, setDocuments] = useState<TaskDocument[]>(sampleDocuments);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<'sop' | 'dataFormat' | 'reportFormat' | 'rulesAndProcedures'>('sop');
    
  const currentUser = {
    id: "1",
    name: "John Doe",
    initials: "JD",
    department: "Engineering",
    position: "Process Engineer"
  };

  const teamMembers = [
    {
      id: "1",
      name: "John Doe",
      initials: "JD",
      department: "Engineering",
      position: "Process Engineer"
    },
    {
      id: "2",
      name: "Sarah Miller",
      initials: "SM",
      department: "Quality",
      position: "Quality Specialist"
    },
    {
      id: "3",
      name: "Robert Johnson",
      initials: "RJ",
      department: "Quality",
      position: "Quality Manager"
    },
    {
      id: "4",
      name: "Alice Davis",
      initials: "AD",
      department: "Management",
      position: "Director"
    }
  ];

  const documentTypes = [
    {
      id: "sop-1",
      name: "Assembly Line SOP",
      description: "Standard operating procedure for assembly line operations.",
      allowedDepartments: ["Engineering", "Production"],
      requiredApprovalLevels: ["initiator", "checker", "approver"]
    },
    {
      id: "data-format-1",
      name: "Supplier Audit Data Format",
      description: "Data recording format for supplier quality audits.",
      allowedDepartments: ["Quality"],
      requiredApprovalLevels: ["initiator", "checker"]
    },
    {
      id: "report-format-1",
      name: "Customer Complaint Report",
      description: "Reporting format for documenting customer complaints.",
      allowedDepartments: ["Quality", "Customer Service"],
      requiredApprovalLevels: ["initiator", "approver"]
    },
    {
      id: "rules-procedures-1",
      name: "Change Management Procedures",
      description: "Rules and procedures for managing changes to documents and processes.",
      allowedDepartments: ["Management", "Engineering", "Quality"],
      requiredApprovalLevels: ["initiator", "approver"]
    }
  ];

  const departments = [
    {
      id: "engineering",
      name: "Engineering"
    },
    {
      id: "quality",
      name: "Quality"
    },
    {
      id: "production",
      name: "Production"
    },
    {
      id: "management",
      name: "Management"
    },
    {
      id: "customer-service",
      name: "Customer Service"
    }
  ];

  const [userPermissions, setUserPermissions] = useState({
    "1": {
      canInitiate: true,
      canCheck: false,
      canApprove: false,
      allowedDocumentTypes: ["sop-1", "data-format-1", "report-format-1", "rules-procedures-1"],
      allowedDepartments: ["engineering", "quality"]
    },
    "2": {
      canInitiate: true,
      canCheck: true,
      canApprove: false,
      allowedDocumentTypes: ["data-format-1"],
      allowedDepartments: ["quality"]
    },
    "3": {
      canInitiate: true,
      canCheck: false,
      canApprove: true,
      allowedDocumentTypes: ["report-format-1"],
      allowedDepartments: ["quality", "customer-service"]
    },
    "4": {
      canInitiate: false,
      canCheck: false,
      canApprove: true,
      allowedDocumentTypes: ["sop-1", "report-format-1", "rules-procedures-1"],
      allowedDepartments: ["management"]
    }
  });

  const handleUpdatePermission = (userId: string, permissions: any) => {
    setUserPermissions(prev => ({
      ...prev,
      [userId]: permissions
    }));
  };

  const currentUserPermissions = userPermissions[currentUser.id] || {
    canInitiate: false,
    canCheck: false,
    canApprove: false,
    allowedDocumentTypes: [],
    allowedDepartments: []
  };
  
  const handleAddDocument = (
    documentType: 'sop' | 'dataFormat' | 'reportFormat' | 'rulesAndProcedures',
    file: File, 
    version: string, 
    notes: string, 
    approvalHierarchy?: ApprovalHierarchy
  ) => {
    const newDocument = {
      id: `doc-${Date.now()}`,
      taskId: `task-demo-${Math.floor(Math.random() * 1000)}`,
      taskTitle: "Sample Task for Document",
      documentType,
      fileName: file.name,
      version,
      uploadDate: new Date().toISOString(),
      uploadedBy: currentUser.id,
      department: currentUser.department,
      isCustomerRelated: false,
      customerName: undefined,
      revisionCount: 1,
      task: {
        id: `task-demo-${Math.floor(Math.random() * 1000)}`,
        title: "Sample Task for Document",
        description: "This is a sample task for demonstration purposes",
        department: currentUser.department,
        assignee: currentUser.id,
        priority: "medium",
        dueDate: "2025-04-30",
        status: "in-progress",
        createdAt: new Date().toISOString(),
        isRecurring: false,
        attachmentsRequired: "required"
      },
      document: {
        id: `doc-${Date.now()}`,
        fileName: file.name,
        fileType: file.type,
        version,
        documentType,
        uploadDate: new Date().toISOString(),
        uploadedBy: currentUser.name,
        notes,
        approvalHierarchy
      }
    };
    
    setDocuments(prev => [newDocument, ...prev]);
    toast({
      title: "Document Uploaded",
      description: `Your ${documentTypeLabels[documentType]} has been uploaded successfully.`
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Manage and track all your quality documents</p>
        </div>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Upload Document
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="sops">SOPs</TabsTrigger>
          <TabsTrigger value="data-formats">Data Formats</TabsTrigger>
          <TabsTrigger value="report-formats">Report Formats</TabsTrigger>
          <TabsTrigger value="rules-procedures">Rules & Procedures</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <DocumentTable documents={documents} />
        </TabsContent>
        <TabsContent value="sops">
          <DocumentTable documents={documents.filter(doc => doc.documentType === 'sop')} />
        </TabsContent>
        <TabsContent value="data-formats">
          <DocumentTable documents={documents.filter(doc => doc.documentType === 'dataFormat')} />
        </TabsContent>
        <TabsContent value="report-formats">
          <DocumentTable documents={documents.filter(doc => doc.documentType === 'reportFormat')} />
        </TabsContent>
        <TabsContent value="rules-procedures">
          <DocumentTable documents={documents.filter(doc => doc.documentType === 'rulesAndProcedures')} />
        </TabsContent>
      </Tabs>

      <UserPermissionsConfig 
        users={teamMembers}
        documentTypes={documentTypes}
        departments={departments}
        userPermissions={userPermissions}
        onUpdatePermission={handleUpdatePermission}
      />

      <DocumentUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUpload={handleAddDocument}
        documentType={selectedDocumentType}
        currentUserId={currentUser.id}
        currentUserPermissions={currentUserPermissions}
        teamMembers={teamMembers}
        documentTypes={documentTypes}
      />
    </div>
  );
};

interface DocumentTableProps {
  documents: TaskDocument[];
}

const DocumentTable: React.FC<DocumentTableProps> = ({ documents }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Document List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="[&_th]:px-4 [&_th]:py-2 [&_th]:text-left">
              <tr>
                <th>Document</th>
                <th>Task</th>
                <th>Version</th>
                <th>Uploaded By</th>
                <th>Upload Date</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(document => (
                <tr key={document.id} className="border-b last:border-none [&_td]:px-4 [&_td]:py-2">
                  <td>
                    <div className="flex items-center space-x-2">
                      {document.documentType === 'sop' && <FileText className="h-4 w-4 text-green-500" />}
                      {document.documentType === 'dataFormat' && <Database className="h-4 w-4 text-blue-500" />}
                      {document.documentType === 'reportFormat' && <PieChart className="h-4 w-4 text-amber-500" />}
                      {document.documentType === 'rulesAndProcedures' && <BookOpen className="h-4 w-4 text-purple-500" />}
                      <span>{document.fileName}</span>
                    </div>
                  </td>
                  <td>{document.taskTitle}</td>
                  <td>{document.version}</td>
                  <td>{document.document.uploadedBy}</td>
                  <td>{new Date(document.uploadDate).toLocaleDateString()}</td>
                  <td>{document.department}</td>
                  <td>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </td>
                </tr>
              ))}
              {documents.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center">No documents found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default Documents;
