
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Database, PieChart, Filter, Plus, Upload, History } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskDocument } from "@/components/dashboard/TaskList";
import { Task } from "@/types/task";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import DocumentViewer from "@/components/tasks/DocumentViewer";
import { toast } from "@/hooks/use-toast";

// Sample data for initial documents display
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
        currentRevisionId: "doc-1-rev2"
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
        currentRevisionId: "doc-2"
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
        currentRevisionId: "doc-3-rev1"
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

  // Extract all documents from tasks
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
      revisions: any[];
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

  // Filter documents based on search, type, and tab selection
  const filterDocuments = () => {
    return allDocuments.filter(doc => {
      const matchesSearch = 
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.taskTitle.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = !documentType || doc.documentType === documentType;
      
      const matchesTab = selectedTab === "all" || 
        (selectedTab === "sop" && doc.documentType === "sop") ||
        (selectedTab === "dataFormat" && doc.documentType === "dataFormat") ||
        (selectedTab === "reportFormat" && doc.documentType === "reportFormat") ||
        (selectedTab === "customer" && doc.isCustomerRelated);
      
      return matchesSearch && matchesType && matchesTab;
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
      case 'sop': return 'Standard Operating Procedure (SOP)';
      case 'dataFormat': return 'Data Recording Format';
      case 'reportFormat': return 'Reporting Format';
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
              fileSize: "1.0 MB", // Mock file size
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
    
    // Check if document type already exists for this task
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
    };
    
    const newDocument: TaskDocument = {
      documentType: newDocumentType,
      revisions: [newRevision],
      currentRevisionId: newRevision.id
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
    setNewDocumentType(null);
    setNewDocumentTask("");
    setNewDocumentFile(null);
    setNewDocumentVersion('1.0');
    
    toast({
      title: "Document Uploaded",
      description: `${getDocumentTypeLabel(newDocumentType)} has been added to the task successfully`
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documents Control</h1>
        <p className="text-muted-foreground">Manage all your quality documents in compliance with IATF standards</p>
      </div>
      
      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="grid grid-cols-5 w-[600px]">
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="sop">SOPs</TabsTrigger>
            <TabsTrigger value="dataFormat">Data Formats</TabsTrigger>
            <TabsTrigger value="reportFormat">Report Formats</TabsTrigger>
            <TabsTrigger value="customer">Customer Documents</TabsTrigger>
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
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90"
              onClick={() => setIsUploadDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-1" />
              Upload Document
            </Button>
          </div>
        </div>
        
        <TabsContent value="all" className="mt-4">
          <DocumentsList 
            documents={filteredDocuments} 
            onViewDocument={(doc) => setViewingDocument({ task: doc.task, document: doc.document })} 
          />
        </TabsContent>
        
        <TabsContent value="sop" className="mt-4">
          <DocumentsList 
            documents={filteredDocuments} 
            onViewDocument={(doc) => setViewingDocument({ task: doc.task, document: doc.document })} 
          />
        </TabsContent>
        
        <TabsContent value="dataFormat" className="mt-4">
          <DocumentsList 
            documents={filteredDocuments} 
            onViewDocument={(doc) => setViewingDocument({ task: doc.task, document: doc.document })} 
          />
        </TabsContent>
        
        <TabsContent value="reportFormat" className="mt-4">
          <DocumentsList 
            documents={filteredDocuments} 
            onViewDocument={(doc) => setViewingDocument({ task: doc.task, document: doc.document })} 
          />
        </TabsContent>
        
        <TabsContent value="customer" className="mt-4">
          <DocumentsList 
            documents={filteredDocuments} 
            onViewDocument={(doc) => setViewingDocument({ task: doc.task, document: doc.document })} 
          />
        </TabsContent>
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
            />
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload New Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Type</label>
              <Select 
                value={newDocumentType || ''} 
                onValueChange={(value) => setNewDocumentType(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sop">Standard Operating Procedure (SOP)</SelectItem>
                  <SelectItem value="dataFormat">Data Recording Format</SelectItem>
                  <SelectItem value="reportFormat">Reporting Format</SelectItem>
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
                  {tasks.map(task => (
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
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
}

const DocumentsList = ({ documents, onViewDocument }: DocumentsListProps) => {
  if (documents.length === 0) {
    return (
      <Card className="p-6">
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">No documents found matching your criteria.</p>
        </div>
      </Card>
    );
  }

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
              <th className="p-3">Revisions</th>
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
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 flex items-center gap-1">
                    <History className="h-3 w-3" /> {doc.revisionCount}
                  </Badge>
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
                    <Button variant="ghost" size="sm">Download</Button>
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
