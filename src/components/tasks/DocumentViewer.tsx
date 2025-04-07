
import React from "react";
import { TaskDocument } from "@/components/dashboard/TaskList";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, User, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface DocumentViewerProps {
  task: {
    id: string;
    title: string;
    assigneeDetails?: {
      name: string;
    };
  };
  document: TaskDocument;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ task, document }) => {
  // Find the current revision or use the latest one
  const currentRevision = document.currentRevisionId
    ? document.revisions.find(rev => rev.id === document.currentRevisionId)
    : document.revisions.length > 0
      ? document.revisions[document.revisions.length - 1]
      : null;

  const documentTypeLabel = {
    'sop': 'Standard Operating Procedure',
    'dataFormat': 'Data Recording Format',
    'reportFormat': 'Reporting Format'
  }[document.documentType];

  if (!currentRevision) {
    return (
      <div className="text-center py-8 text-gray-500">
        No document revisions available
      </div>
    );
  }

  // For this demo, we don't have actual document content to display
  // In a real application, you would fetch and render the document content here
  return (
    <div className="space-y-4">
      <div className="bg-muted/30 p-3 rounded-md">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">{task.title}</h3>
            <p className="text-sm text-muted-foreground">
              Assigned to: {task.assigneeDetails?.name || "Unassigned"}
            </p>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {documentTypeLabel}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="document" className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="document">Document Content</TabsTrigger>
          <TabsTrigger value="info">Document Information</TabsTrigger>
        </TabsList>
        <TabsContent value="document" className="p-4 border rounded-md mt-2">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="font-medium">{currentRevision.fileName}</span>
            </div>
            <Button size="sm" variant="outline" className="flex items-center gap-1">
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
          <Separator className="my-4" />
          
          {/* This would normally display the actual document content */}
          <div className="bg-gray-50 border border-dashed p-8 rounded text-center">
            <div className="mb-4 text-sm text-muted-foreground">Document Preview</div>
            
            {document.documentType === 'sop' && (
              <div className="space-y-4 text-left">
                <h2 className="text-xl font-bold">Standard Operating Procedure</h2>
                <p className="text-sm">
                  This document provides step-by-step instructions for completing the task: <strong>{task.title}</strong>
                </p>
                <h3 className="font-medium">Procedure Steps:</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Prepare the necessary equipment and materials</li>
                  <li>Conduct initial inspection according to quality guidelines</li>
                  <li>Record measurements in the data recording sheet</li>
                  <li>Analyze results against acceptance criteria</li>
                  <li>Document any deviations or non-conformances</li>
                  <li>Complete the task report using the reporting format</li>
                </ol>
              </div>
            )}
            
            {document.documentType === 'dataFormat' && (
              <div className="space-y-4 text-left">
                <h2 className="text-xl font-bold">Data Recording Format</h2>
                <p className="text-sm">
                  Use this format to record data for task: <strong>{task.title}</strong>
                </p>
                <table className="border w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">Parameter</th>
                      <th className="border p-2">Specification</th>
                      <th className="border p-2">Measured Value</th>
                      <th className="border p-2">Pass/Fail</th>
                      <th className="border p-2">Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map(i => (
                      <tr key={i}>
                        <td className="border p-2">Parameter {i}</td>
                        <td className="border p-2">Value between X-Y</td>
                        <td className="border p-2"></td>
                        <td className="border p-2"></td>
                        <td className="border p-2"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {document.documentType === 'reportFormat' && (
              <div className="space-y-4 text-left">
                <h2 className="text-xl font-bold">Reporting Format</h2>
                <p className="text-sm">
                  Complete this report after finishing task: <strong>{task.title}</strong>
                </p>
                <div className="border p-4 rounded space-y-3">
                  <div>
                    <label className="text-sm font-medium block">Task Summary:</label>
                    <div className="h-8 bg-white border rounded mt-1"></div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block">Findings:</label>
                    <div className="h-20 bg-white border rounded mt-1"></div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block">Recommendations:</label>
                    <div className="h-12 bg-white border rounded mt-1"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block">Completed By:</label>
                      <div className="h-8 bg-white border rounded mt-1"></div>
                    </div>
                    <div>
                      <label className="text-sm font-medium block">Date:</label>
                      <div className="h-8 bg-white border rounded mt-1"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="info" className="p-4 border rounded-md mt-2">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <FileType className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">File Name</p>
                <p className="text-sm text-muted-foreground">{currentRevision.fileName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline">v{currentRevision.version}</Badge>
              <div>
                <p className="text-sm font-medium">Version</p>
                <p className="text-sm text-muted-foreground">
                  {document.revisions.length > 1 ? 
                    `${document.revisions.indexOf(currentRevision) + 1} of ${document.revisions.length}` : 
                    'Initial version'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Upload Date</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(currentRevision.uploadDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Uploaded By</p>
                <p className="text-sm text-muted-foreground">{currentRevision.uploadedBy}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Revision History</h3>
              <div className="border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2">Version</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {document.revisions.map((rev) => (
                      <tr key={rev.id} className={rev.id === currentRevision.id ? "bg-blue-50" : ""}>
                        <td className="p-2">v{rev.version}</td>
                        <td className="p-2">{new Date(rev.uploadDate).toLocaleDateString()}</td>
                        <td className="p-2">{rev.uploadedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentViewer;
