
import React from "react";
import { FileText, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DocumentRevision } from "@/types/document";

interface DocumentContentTabProps {
  currentRevision: DocumentRevision;
  documentType: string;
  task: {
    title: string;
  };
  approvalStatus?: string;
}

const DocumentContentTab: React.FC<DocumentContentTabProps> = ({
  currentRevision,
  documentType,
  task,
  approvalStatus,
}) => {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <span className="font-medium">{currentRevision.fileName}</span>
          <Badge variant="outline">v{currentRevision.version}</Badge>
        </div>
        {approvalStatus === 'approved' && (
          <Button size="sm" variant="outline" className="flex items-center gap-1">
            <Download className="h-4 w-4" /> Download
          </Button>
        )}
      </div>
      <Separator className="my-4" />
      
      {/* Document preview content */}
      <div className="bg-gray-50 border border-dashed p-8 rounded text-center">
        <div className="mb-4 text-sm text-muted-foreground">Document Preview</div>
        
        {documentType === 'sop' && (
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
        
        {documentType === 'dataFormat' && (
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
        
        {documentType === 'reportFormat' && (
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
    </>
  );
};

export default DocumentContentTab;
