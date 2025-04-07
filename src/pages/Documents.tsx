
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Database, PieChart, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskDocument } from "@/components/dashboard/TaskList";
import { Task } from "@/types/task";

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
            version: "1.2",
            uploadDate: "2025-03-15",
            uploadedBy: "John Doe",
            fileSize: "1.2 MB",
          }
        ],
        currentRevisionId: "doc-1"
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
            version: "2.1",
            uploadDate: "2025-04-06",
            uploadedBy: "John Doe",
            fileSize: "750 KB",
          }
        ],
        currentRevisionId: "doc-3"
      }
    ]
  }
];

const Documents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("all");

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
    }[] = [];

    initialTasks.forEach(task => {
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
              customerName: task.customerName
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
          </div>
        </div>
        
        <TabsContent value="all" className="mt-4">
          <DocumentsList documents={filteredDocuments} />
        </TabsContent>
        
        <TabsContent value="sop" className="mt-4">
          <DocumentsList documents={filteredDocuments} />
        </TabsContent>
        
        <TabsContent value="dataFormat" className="mt-4">
          <DocumentsList documents={filteredDocuments} />
        </TabsContent>
        
        <TabsContent value="reportFormat" className="mt-4">
          <DocumentsList documents={filteredDocuments} />
        </TabsContent>
        
        <TabsContent value="customer" className="mt-4">
          <DocumentsList documents={filteredDocuments} />
        </TabsContent>
      </Tabs>
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
  }[];
}

const DocumentsList = ({ documents }: DocumentsListProps) => {
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
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">View</Button>
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
