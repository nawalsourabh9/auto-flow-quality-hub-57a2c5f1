import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Database, PieChart, Filter, Plus, Upload, History, CheckCircle, X, AlertCircle, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskDocument } from "@/components/dashboard/TaskList";
import { Task } from "@/types/task";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import DocumentViewer from "@/components/tasks/DocumentViewer";
import { toast } from "@/hooks/use-toast";
import { DocumentType, ApprovalHierarchy, DocumentPermissions } from "@/types/document";
import { Textarea } from "@/components/ui/textarea";
import { DocumentApprovalFlow } from "@/components/documents/DocumentApprovalFlow";

const documentTypes: DocumentType[] = [
  {
    id: "dt1",
    name: "Standard Operating Procedure (SOP)",
    description: "Detailed step-by-step instructions for performing specific tasks",
    allowedDepartments: ["Quality", "Production", "Engineering"],
    requiredApprovalLevels: ["initiator", "checker", "approver"]
  },
  {
    id: "dt2",
    name: "Data Recording Format",
    description: "Templates for recording data during quality operations",
    allowedDepartments: ["Quality", "Production"],
    requiredApprovalLevels: ["initiator", "checker"]
  },
  {
    id: "dt3",
    name: "Reporting Format",
    description: "Templates for creating standardized reports",
    allowedDepartments: ["Quality", "Engineering", "Management"],
    requiredApprovalLevels: ["initiator", "checker", "approver"]
  }
];

const userDocumentPermissions: Record<string, DocumentPermissions> = {
  "1": { // John Doe (Quality Manager)
    canInitiate: true,
    canCheck: true,
    canApprove: true,
    allowedDocumentTypes: ["dt1", "dt2", "dt3"],
    allowedDepartments: ["Quality"]
  },
  "2": { // Jane Smith (Production Supervisor)
    canInitiate: true,
    canCheck: true,
    canApprove: false,
    allowedDocumentTypes: ["dt1", "dt2"],
    allowedDepartments: ["Production"]
  },
  "3": { // Robert Johnson (Engineer)
    canInitiate: true,
    canCheck: false,
    canApprove: false,
    allowedDocumentTypes: ["dt1"],
    allowedDepartments: ["Engineering"]
  }
};

const teamMembers = [
  { id: "1", name: "John Doe", position: "Quality Manager", department: "Quality", initials: "JD" },
  { id: "2", name: "Jane Smith", position: "Production Supervisor", department: "Production", initials: "JS" },
  { id: "3", name: "Robert Johnson", position: "Engineer", department: "Engineering", initials: "RJ" },
  { id: "4", name: "Emily Davis", position: "Quality Specialist", department: "Quality", initials: "ED" },
  { id: "5", name: "Michael Brown", position: "Plant Manager", department: "Management", initials: "MB" }
];

const initialTasks: Task[] = [
  {
    id: "t1",
    title: "Daily Quality Check - Assembly Line A",
    description: "Perform standard quality checks on Assembly Line A products",
    department: "Quality",
    assignee: "1",
    assigneeDetails: {
      name: "John Doe",
      initials: "JD",
      department: "Quality",
      position: "Quality Manager"
    },
    priority: "high",
    dueDate: "2025-04-08",
    status: "not-started",
    createdAt: "2025-04-07",
    isRecurring: true,
    recurringFrequency: "daily",
    attachmentsRequired: "required",
    isCustomerRelated: false,
    documents: [
      {
        documentType: 'sop',
        revisions: [
          {
            id: "doc-1",
            fileName: "Assembly_Line_A_Quality_Check_SOP.pdf",
            version: "1.0",
            uploadDate: "2025-03-01",
            uploadedBy: "John Doe",
            fileSize: "1.0 MB",
          },
          {
            id: "doc-1-rev1",
            fileName: "Assembly_Line_A_Quality_Check_SOP.pdf",
            version: "1.1",
            uploadDate: "2025-03-10",
            uploadedBy: "John Doe",
            fileSize: "1.1 MB",
            notes: "Updated inspection criteria based on new standards"
          },
          {
            id: "doc-1-rev2",
            fileName: "Assembly_Line_A_Quality_Check_SOP.pdf",
            version: "1.2",
            uploadDate: "2025-03-15",
            uploadedBy: "John Doe",
            fileSize: "1.2 MB",
            notes: "Added section on safety procedures"
          }
        ],
        currentRevisionId: "doc-1-rev2",
        approvalHierarchy: {
          initiator: "1", // John Doe
          checker: "4",   // Emily Davis
          approver: "5",  // Michael Brown
          initiatorApproved: true,
          checkerApproved: true,
          approverApproved: true,
          status: "approved",
          initiatedAt: "2025-03-15T10:00:00Z",
          checkedAt: "2025-03-16T14:30:00Z",
          approvedAt: "2025-03-17T09:15:00Z"
        }
      }
    ]
  },
  {
    id: "t4",
    title: "Customer Complaint Resolution - ABC Corp",
    description: "Investigate and resolve customer complaint regarding product quality",
    department: "Quality",
    assignee: "1",
    assigneeDetails: {
      name: "John Doe",
      initials: "JD",
      department: "Quality",
      position: "Quality Manager"
    },
    priority: "high",
    dueDate: "2025-04-10",
    status: "in-progress",
    createdAt: "2025-04-06",
    isRecurring: false,
    attachmentsRequired: "required",
    isCustomerRelated: true,
    customerName: "ABC Corporation",
    documents: [
      {
        documentType: 'dataFormat',
        revisions: [
          {
            id: "doc-2",
            fileName: "Customer_Complaint_Data_Form.xlsx",
            version: "1.0",
            uploadDate: "2025-04-06",
            uploadedBy: "John Doe",
            fileSize: "450 KB",
          }
        ],
        currentRevisionId: "doc-2",
        approvalHierarchy: {
          initiator: "1", // John Doe
          checker: "4",   // Emily Davis
          status: "pending-checker",
          initiatorApproved: true,
          initiatedAt: "2025-04-06T15:45:00Z"
        }
      },
      {
        documentType: 'reportFormat',
        revisions: [
          {
            id: "doc-3",
            fileName: "Complaint_Investigation_Report_Template.docx",
            version: "2.0",
            uploadDate: "2025-04-01",
            uploadedBy: "Emily Davis",
            fileSize: "700 KB",
          },
          {
            id: "doc-3-rev1",
            fileName: "Complaint_Investigation_Report_Template.docx",
            version: "2.1",
            uploadDate: "2025-04-06",
            uploadedBy: "John Doe",
            fileSize: "750 KB",
            notes: "Updated to include root cause analysis section"
          }
        ],
        currentRevisionId: "doc-3-rev1",
        approvalHierarchy: {
          initiator: "4", // Emily Davis
          checker: "1",   // John Doe
          approver: "5",  // Michael Brown
          initiatorApproved: true,
          checkerApproved: true,
          status: "pending-approval",
          initiatedAt: "2025-04-06T16:30:00Z",
          checkedAt: "2025-04-06T17:15:00Z"
        }
      }
    ]
  }
];

const Documents = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchTerm, setSearchTerm] = useState("");
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("all");
  const [viewingDocument, setViewingDocument] = useState<{
    task: Task,
    document: TaskDocument
  } | null>(null);
  
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [newDocumentType, setNewDocumentType] = useState<'sop' | 'dataFormat' | 'reportFormat' | null>(null);
  const [newDocumentTask, setNewDocumentTask] = useState<string>("");
  const [newDocumentFile, setNewDocumentFile] = useState<File | null>(null);
  const [newDocumentVersion, setNewDocumentVersion] = useState('1.0');
  const [newDocumentNotes, setNewDocumentNotes] = useState('');
  
  const [selectedChecker, setSelectedChecker] = useState<string | null>(null);
  const [selectedApprover, setSelectedApprover] = useState<string | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<'draft' | 'pending-checker' | 'pending-approval'>('draft');
  const [approvalFilterStatus, setApprovalFilterStatus] = useState<string | null>(null);

  const currentUserId = "1";
  const currentUserPermissions = userDocumentPermissions[currentUserId];

  const getAllDocuments = () => {
    const documents: {
      id: string;
      taskId: string;
      taskTitle: string;
      documentType: string;
      fileName: string;
      version: string;
      uploadDate: string;
      uploadedBy: string;
      department: string;
      isCustomerRelated: boolean;
      customerName?: string;
      revisionCount: number;
      task: Task;
      document: TaskDocument;
    }[] = [];

    tasks.forEach(task => {
      if (task.documents && task.documents.length > 0) {
        task.documents.forEach(doc => {
          const currentRevision = doc.revisions.find(rev => rev.id === doc.currentRevisionId);
          if (currentRevision) {
            documents.push({
              id: currentRevision.id,
              taskId: task.id,
              taskTitle: task.title,
              documentType: doc.documentType,
              fileName: currentRevision.fileName,
              version: currentRevision.version,
              uploadDate: currentRevision.uploadDate,
              uploadedBy: currentRevision.uploadedBy,
              department: task.department,
              isCustomerRelated: task.isCustomerRelated || false,
              customerName: task.customerName,
              revisions: doc.revisions,
              revisionCount: doc.revisions.length,
              task: task,
              document: doc
            });
          }
        });
      }
    });

    return documents;
  };

  const allDocuments = getAllDocuments();

  const filterDocuments = () => {
    return allDocuments.filter(doc => {
      const matchesSearch = 
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.taskTitle.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = !documentType || doc.documentType === documentType;
      
      let matchesTab = selectedTab === "all";
      if (selectedTab === "sop") matchesTab = doc.documentType === "sop";
      else if (selectedTab === "dataFormat") matchesTab = doc.documentType === "dataFormat";
      else if (selectedTab === "reportFormat") matchesTab = doc.documentType === "reportFormat";
      else if (selectedTab === "customer") matchesTab = doc.isCustomerRelated;
      else if (selectedTab === "draft") matchesTab = doc.document.approvalHierarchy?.status === "draft";
      else if (selectedTab === "pending") {
        matchesTab = doc.document.approvalHierarchy?.status === "pending-checker" || 
                    doc.document.approvalHierarchy?.status === "pending-approval";
      }
      else if (selectedTab === "approved") matchesTab = doc.document.approvalHierarchy?.status === "approved";
      else if (selectedTab === "rejected") matchesTab = doc.document.approvalHierarchy?.status === "rejected";
      
      const matchesApprovalStatus = !approvalFilterStatus || 
        (doc.document.approvalHierarchy && doc.document.approvalHierarchy.status === approvalFilterStatus);
      
      return matchesSearch && matchesType && matchesTab && matchesApprovalStatus;
    });
  };

  const filteredDocuments = filterDocuments();

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'sop': return <FileText className="h-5 w-5 text-green-500" />;
      case 'dataFormat': return <Database className="h-5 w-5 text-blue-500" />;
      case 'reportFormat': return <PieChart className="h-5 w-5 text-amber-500" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };
  
  const getDocumentTypeLabel = (type: string): string => {
    switch (type) {
      case 'sop': return 'SOP';
      case 'dataFormat': return 'Data Format';
      case 'reportFormat': return 'Report Format';
      default: return 'Document';
    }
  };
  
  const handleUpdateRevision = (taskId: string, documentType: string, revisionId: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId && task.documents) {
        const updatedDocs = task.documents.map(doc => {
          if (doc.documentType === documentType) {
            return {
              ...doc,
              currentRevisionId: revisionId
            };
          }
          return doc;
        });
        
        return {
          ...task,
          documents: updatedDocs
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    toast({
      title: "Revision Updated",
      description: "Document revision has been updated successfully"
    });
  };
  
  const handleAddNewRevision = (taskId: string, documentType: string, fileName: string, version: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId && task.documents) {
        const updatedDocs = task.documents.map(doc => {
          if (doc.documentType === documentType) {
            const newRevision = {
              id: `doc-${Date.now()}`,
              fileName,
              version,
              uploadDate: new Date().toISOString(),
              uploadedBy: "Current User",
              fileSize: "1.0 MB",
            };
            
            return {
              ...doc,
              revisions: [...doc.revisions, newRevision],
              currentRevisionId: newRevision.id
            };
          }
          return doc;
        });
        
        return {
          ...task,
          documents: updatedDocs
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    toast({
      title: "New Revision Added",
      description: `Version ${version} has been added successfully`
    });
  };

  const handleUpdateApprovalStatus = (
    taskId: string, 
    docType: string, 
    action: 'initiate' | 'check' | 'approve' | 'reject', 
    reason?: string
  ) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const updatedDocuments = task.documents?.map(doc => {
          if (doc.documentType === docType) {
            let updatedHierarchy = doc.approvalHierarchy || {
              initiator: currentUserId,
              status: 'draft'
            };
            
            const now = new Date().toISOString();
            
            switch(action) {
              case 'initiate':
                updatedHierarchy = {
                  ...updatedHierarchy,
                  initiator: currentUserId,
                  initiatorApproved: true,
                  status: 'pending-checker',
                  initiatedAt: now
                };
                break;
              case 'check':
                updatedHierarchy = {
                  ...updatedHierarchy,
                  checker: currentUserId,
                  checkerApproved: true,
                  status: 'pending-approval',
                  checkedAt: now
                };
                break;
              case 'approve':
                updatedHierarchy = {
                  ...updatedHierarchy,
                  approver: currentUserId,
                  approverApproved: true,
                  status: 'approved',
                  approvedAt: now
                };
                break;
              case 'reject':
                updatedHierarchy = {
                  ...updatedHierarchy,
                  status: 'rejected',
                  rejectedAt: now,
                  rejectedBy: currentUserId,
                  rejectionReason: reason
                };
                break;
            }
            
            return {
              ...doc,
              approvalHierarchy: updatedHierarchy
            };
          }
          return doc;
        });
        
        return {
          ...task,
          documents: updatedDocuments
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    
    toast({
      title: `Document ${action === 'reject' ? 'Rejected' : `${action.charAt(0).toUpperCase() + action.slice(1)}d`}`,
      description: `Document has been successfully ${action === 'reject' ? 'rejected' : `${action}d`}`
    });
  };

  const getUserRole = (userId: string): 'initiator' | 'checker' | 'approver' | null => {
    const permissions = userDocumentPermissions[userId];
    if (!permissions) return null;
    
    if (permissions.canApprove) return 'approver';
    if (permissions.canCheck) return 'checker';
    if (permissions.canInitiate) return 'initiator';
    return null;
  };
  
  const handleUploadNewDocument = () => {
    if (!newDocumentType || !newDocumentTask || !newDocumentFile || !newDocumentVersion) {
      toast({
        title: "Missing Information",
        description: "Please provide all required information",
        variant: "destructive"
      });
      return;
    }
    
    const targetTask = tasks.find(task => task.id === newDocumentTask);
    if (!targetTask) {
      toast({
        title: "Invalid Task",
        description: "Selected task could not be found",
        variant: "destructive"
      });
      return;
    }
    
    if (!currentUserPermissions.canInitiate) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to initiate documents",
        variant: "destructive"
      });
      return;
    }
    
    const docTypeDetails = documentTypes.find(dt => 
      (dt.name.toLowerCase().includes(newDocumentType) || 
      (newDocumentType === 'sop' && dt.id === 'dt1') ||
      (newDocumentType === 'dataFormat' && dt.id === 'dt2') ||
      (newDocumentType === 'reportFormat' && dt.id === 'dt3'))
    );
    
    if (docTypeDetails && !docTypeDetails.allowedDepartments.includes(targetTask.department)) {
      toast({
        title: "Department Restriction",
        description: `This document type cannot be used in the ${targetTask.department} department`,
        variant: "destructive"
      });
      return;
    }
    
    if (targetTask.documents?.some(doc => doc.documentType === newDocumentType)) {
      toast({
        title: "Document Already Exists",
        description: `This task already has a ${getDocumentTypeLabel(newDocumentType)}. You can add a new revision instead.`,
        variant: "destructive"
      });
      return;
    }
    
    const newRevision = {
      id: `doc-${Date.now()}`,
      fileName: newDocumentFile.name,
      version: newDocumentVersion,
      uploadDate: new Date().toISOString(),
      uploadedBy: "Current User",
      fileSize: `${Math.round(newDocumentFile.size / 1024)} KB`,
      notes: newDocumentNotes || undefined
    };
    
    const approvalHierarchy: ApprovalHierarchy = {
      initiator: currentUserId,
      status: approvalStatus
    };
    
    if (selectedChecker) {
      approvalHierarchy.checker = selectedChecker;
    }
    
    if (selectedApprover) {
      approvalHierarchy.approver = selectedApprover;
    }
    
    if (approvalStatus !== 'draft') {
      approvalHierarchy.initiatorApproved = true;
      approvalHierarchy.initiatedAt = new Date().toISOString();
    }
    
    const newDocument: TaskDocument = {
      documentType: newDocumentType,
      revisions: [newRevision],
      currentRevisionId: newRevision.id,
      approvalHierarchy
    };
    
    const updatedTasks = tasks.map(task => {
      if (task.id === newDocumentTask) {
        return {
          ...task,
          documents: [...(task.documents || []), newDocument]
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    setIsUploadDialogOpen(false);
    clearDocumentUploadForm();
    
    toast({
      title: "Document Uploaded",
      description: `${getDocumentTypeLabel(newDocumentType)} has been added to the task ${
        approvalStatus === 'draft' ? 'as a draft' : 
        approvalStatus === 'pending-checker' ? 'and sent for checking' : 
        'and sent for approval'
      }`
    });
  };
  
  const clearDocumentUploadForm = () => {
    setNewDocumentType(null);
    setNewDocumentTask("");
    setNewDocumentFile(null);
    setNewDocumentVersion('1.0');
    setNewDocumentNotes('');
    setSelectedChecker(null);
    setSelectedApprover(null);
    setApprovalStatus('draft');
  };

  const getApprovalStatusBadge = (status?: string) => {
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
        return <Badge variant="outline" className="bg-red-50 text-red-700 flex items-center gap-1"><X className="h-3 w-3" /> Rejected</Badge>;
      default:
        return null;
    }
  };

  const getRequiredApprovalLevels = (docType: string): ('initiator' | 'checker' | 'approver')[] => {
    if (docType === 'sop' || docType === 'reportFormat') {
      return ['initiator', 'checker', 'approver'];
    } else {
      return ['initiator', 'checker'];
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documents Control</h1>
        <p className="text-muted-foreground">Manage all your quality documents in compliance with IATF standards</p>
      </div>
      
      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="grid grid-cols-8 w-[900px]">
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="sop">SOPs</TabsTrigger>
            <TabsTrigger value="dataFormat">Data Formats</TabsTrigger>
            <TabsTrigger value="reportFormat">Report Formats</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search documents..." 
                className="pl-8 h-9 w-[250px] rounded-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={documentType || "all"} onValueChange={(value) => setDocumentType(value === "all" ? null : value)}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sop">SOPs</SelectItem>
                <SelectItem value="dataFormat">Data Formats</SelectItem>
                <SelectItem value="reportFormat">Report Formats</SelectItem>
              </SelectContent>
            </Select>
            {currentUserPermissions?.canInitiate && (
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90"
                onClick={() => setIsUploadDialogOpen(true)}
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload Document
              </Button>
            )}
          </div>
        </div>
        
        {['all', 'draft', 'pending', 'approved', 'rejected', 'sop', 'dataFormat', 'reportFormat', 'customer'].map(tabValue => (
          <TabsContent key={tabValue} value={tabValue} className="mt-4">
            <DocumentsList 
              documents={filteredDocuments} 
              onViewDocument={(doc) => setViewingDocument({ task: doc.task, document: doc.document })}
              currentUserPermissions={currentUserPermissions}
              currentUserId={currentUserId}
              onUpdateApprovalStatus={handleUpdateApprovalStatus}
            />
          </TabsContent>
        ))}
      </Tabs>
      
      <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
          </DialogHeader>
          {viewingDocument && (
            <DocumentViewer 
              task={viewingDocument.task} 
              document={viewingDocument.document} 
              onUpdateRevision={(documentType, revisionId) => {
                handleUpdateRevision(viewingDocument.task.id, documentType, revisionId);
              }}
              onAddNewRevision={(documentType, fileName, version) => {
                handleAddNewRevision(viewingDocument.task.id, documentType, fileName, version);
              }}
              currentUserId={currentUserId}
              currentUserPermissions={currentUserPermissions}
              onUpdateApprovalStatus={(action, reason) => {
                handleUpdateApprovalStatus(
                  viewingDocument.task.id, 
                  viewingDocument.document.documentType, 
                  action, 
                  reason
                );
              }}
              teamMembers={teamMembers}
            />
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upload New Document</DialogTitle>
            <DialogDescription>
              Create a new document and set up its approval workflow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Type</label>
              <Select 
                value={newDocumentType || ''} 
                onValueChange={(value) => {
                  setNewDocumentType(value as any);
                  
                  setSelectedChecker(null);
                  setSelectedApprover(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.filter(dt => 
                    currentUserPermissions?.allowedDocumentTypes.includes(dt.id)
                  ).map(dt => (
                    <SelectItem 
                      key={dt.id} 
                      value={
                        dt.name.toLowerCase().includes('sop') ? 'sop' : 
                        dt.name.toLowerCase().includes('data') ? 'dataFormat' : 
                        'reportFormat'
                      }
                    >
                      {dt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Related Task</label>
              <Select 
                value={newDocumentTask} 
                onValueChange={setNewDocumentTask}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select related task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.filter(task => 
                    !currentUserPermissions?.allowedDepartments.length || 
                    currentUserPermissions.allowedDepartments.includes(task.department)
                  ).map(task => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Version</label>
              <Input 
                placeholder="e.g., 1.0" 
                value={newDocumentVersion} 
                onChange={(e) => setNewDocumentVersion(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload File</label>
              <Input 
                type="file" 
                onChange={(e) => e.target.files && setNewDocumentFile(e.target.files[0])} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes/Description</label>
              <Textarea 
                placeholder="Provide any additional information about this document" 
                value={newDocumentNotes} 
                onChange={(e) => setNewDocumentNotes(e.target.value)} 
              />
            </div>
            
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium mb-4">Document Approval Flow</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-100 text-blue-700 border-none">Initiator</Badge>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {teamMembers.find(m => m.id === currentUserId)?.initials || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{teamMembers.find(m => m.id === currentUserId)?.name || "Current User"}</span>
                  </div>
                </div>
                
                {newDocumentType && getRequiredApprovalLevels(newDocumentType).includes('checker') && (
                  <div className="flex items-center gap-3">
                    <Badge className="bg-amber-100 text-amber-700 border-none">Checker</Badge>
                    <Select 
                      value={selectedChecker || ''} 
                      onValueChange={setSelectedChecker}
                    >
                      <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Select a checker" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers
                          .filter(member => 
                            member.id !== currentUserId && 
                            userDocumentPermissions[member.id]?.canCheck
                          )
                          .map(member => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name} ({member.position})
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {newDocumentType && getRequiredApprovalLevels(newDocumentType).includes('approver') && (
                  <div className="flex items-center gap-3">
                    <Badge className="bg-green-100 text-green-700 border-none">Approver</Badge>
                    <Select 
                      value={selectedApprover || ''} 
                      onValueChange={setSelectedApprover}
                    >
                      <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Select an approver" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers
                          .filter(member => 
                            member.id !== currentUserId && 
                            member.id !== selectedChecker && 
                            userDocumentPermissions[member.id]?.canApprove
                          )
                          .map(member => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name} ({member.position})
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium w-32">Initial Status:</label>
                  <Select 
                    value={approvalStatus} 
                    onValueChange={(value) => setApprovalStatus(value as any)}
                  >
                    <SelectTrigger className="w-[280px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Save as Draft</SelectItem>
                      <SelectItem value="pending-checker" disabled={!selectedChecker && newDocumentType && getRequiredApprovalLevels(newDocumentType).includes('checker')}>
                        Submit for Checking
                      </SelectItem>
                      <SelectItem value="pending-approval" disabled={
                        (!selectedChecker && newDocumentType && getRequiredApprovalLevels(newDocumentType).includes('checker')) ||
                        (!selectedApprover && newDocumentType && getRequiredApprovalLevels(newDocumentType).includes('approver'))
                      }>
                        Submit for Approval
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsUploadDialogOpen(false);
              clearDocumentUploadForm();
            }}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleUploadNewDocument}>
              Upload Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface DocumentsListProps {
  documents: {
    id: string;
    taskId: string;
    taskTitle: string;
    documentType: string;
    fileName: string;
    version: string;
    uploadDate: string;
    uploadedBy: string;
    department: string;
    isCustomerRelated: boolean;
    customerName?: string;
    revisionCount: number;
    task: Task;
    document: TaskDocument;
  }[];
  onViewDocument: (document: any) => void;
  currentUserPermissions: DocumentPermissions | undefined;
  currentUserId: string;
  onUpdateApprovalStatus: (taskId: string, documentType: string, action: 'initiate' | 'check' | 'approve' | 'reject', reason?: string) => void;
}

const DocumentsList = ({ 
  documents, 
  onViewDocument,
  currentUserPermissions,
  currentUserId,
  onUpdateApprovalStatus
}: DocumentsListProps) => {
  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'sop': return <FileText className="h-5 w-5 text-green-500" />;
      case 'dataFormat': return <Database className="h-5 w-5 text-blue-500" />;
      case 'reportFormat': return <PieChart className="h-5 w-5 text-amber-500" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };
  
  const getDocumentTypeLabel = (type: string): string => {
    switch (type) {
      case 'sop': return 'SOP';
      case 'dataFormat': return 'Data Format';
      case 'reportFormat': return 'Report Format';
      default: return 'Document';
    }
  };
  
  const getFileTypeFromName = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'PDF';
      case 'doc':
      case 'docx': return 'Word';
      case 'xls':
      case 'xlsx': return 'Excel';
      case 'ppt':
      case 'pptx': return 'PowerPoint';
      case 'csv': return 'CSV';
      default: return 'File';
    }
  };

  const getApprovalStatusBadge = (doc: any) => {
    const status = doc.document.approvalHierarchy?.status;
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
        return <Badge variant="outline" className="bg-red-50 text-red-700 flex items-center gap-1"><X className="h-3 w-3" /> Rejected</Badge>;
      default:
        return null;
    }
  };

  const canTakeAction = (doc: any) => {
    if (!doc.document.approvalHierarchy) return false;
    const hierarchy = doc.document.approvalHierarchy;
    
    if (hierarchy.status === 'pending-checker' && 
        hierarchy.checker === currentUserId && 
        currentUserPermissions?.canCheck) {
      return true;
    }
    
    if (hierarchy.status === 'pending-approval' && 
        hierarchy.approver === currentUserId && 
        currentUserPermissions?.canApprove) {
      return true;
    }
    
    return false;
  };

  if (documents.length === 0) {
    return (
      <Card className="p-6">
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">No documents found matching your criteria.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-lg">Document Library</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr className="text-left text-xs font-medium text-muted-foreground">
              <th className="p-3">Document</th>
              <th className="p-3">Type</th>
              <th className="p-3">Related Task</th>
              <th className="p-3">Department</th>
              <th className="p-3">Version</th>
              <th className="p-3">Last Updated</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-muted/30">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {getDocumentTypeIcon(doc.documentType)}
                    <div>
                      <p className="text-sm font-medium">{doc.fileName}</p>
                      <span className="text-xs text-muted-foreground">{getFileTypeFromName(doc.fileName)}</span>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <Badge variant="outline" className="bg-gray-50">
                    {getDocumentTypeLabel(doc.documentType)}
                  </Badge>
                </td>
                <td className="p-3">
                  <div>
                    <p className="text-sm">{doc.taskTitle}</p>
                    {doc.isCustomerRelated && doc.customerName && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-100 mt-1">
                        {doc.customerName}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <Badge variant="secondary" className="text-xs">
                    {doc.department}
                  </Badge>
                </td>
                <td className="p-3">
                  <span className="text-sm">v{doc.version}</span>
                </td>
                <td className="p-3">
                  <div>
                    <p className="text-sm">{new Date(doc.uploadDate).toLocaleDateString()}</p>
                    <span className="text-xs text-muted-foreground">by {doc.uploadedBy}</span>
                  </div>
                </td>
                <td className="p-3">
                  {getApprovalStatusBadge(doc)}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewDocument(doc)}
                    >
                      View
                    </Button>
                    {canTakeAction(doc) && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => onViewDocument(doc)}
                      >
                        Review
                      </Button>
                    )}
                    {doc.document.approvalHierarchy?.status === 'approved' && (
                      <Button variant="ghost" size="sm">Download</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default Documents;
