
import React from "react";
import { Badge } from "@/components/ui/badge";
import { FileText, Database, PieChart, BookOpen, CheckCircle } from "lucide-react";
import { Task } from "@/types/task";
import { TaskDocument } from "@/types/document";

interface TaskDocumentBadgesProps {
  task: Task;
  setViewingDocument: (data: { task: Task, document: TaskDocument } | null) => void;
}

export const TaskDocumentBadges: React.FC<TaskDocumentBadgesProps> = ({ task, setViewingDocument }) => {
  if (!task.documents || task.documents.length === 0) return null;
  
  const documentTypes = {
    sop: task.documents.find(doc => doc.documentType === 'sop'),
    dataFormat: task.documents.find(doc => doc.documentType === 'dataFormat'),
    reportFormat: task.documents.find(doc => doc.documentType === 'reportFormat'),
    rulesAndProcedures: task.documents.find(doc => doc.documentType === 'rulesAndProcedures')
  };

  return (
    <div className="flex flex-wrap gap-1">
      {documentTypes.sop && (
        <Badge 
          variant="outline" 
          className={`${
            documentTypes.sop.approvalHierarchy?.status === 'approved' ? 'bg-green-50 text-green-700' : 
            documentTypes.sop.approvalHierarchy?.status === 'rejected' ? 'bg-red-50 text-red-700' : 
            'bg-amber-50 text-amber-700'
          } hover:bg-green-100 flex items-center gap-1 cursor-pointer`}
          onClick={(e) => {
            e.stopPropagation();
            setViewingDocument({ task, document: documentTypes.sop! });
          }}
        >
          <FileText className="h-3 w-3" /> SOP
          {documentTypes.sop.approvalHierarchy?.status === 'approved' && <CheckCircle className="h-2 w-2 ml-1" />}
        </Badge>
      )}
      {documentTypes.dataFormat && (
        <Badge 
          variant="outline" 
          className={`${
            documentTypes.dataFormat.approvalHierarchy?.status === 'approved' ? 'bg-green-50 text-green-700' : 
            documentTypes.dataFormat.approvalHierarchy?.status === 'rejected' ? 'bg-red-50 text-red-700' : 
            'bg-blue-50 text-blue-700'
          } hover:bg-blue-100 flex items-center gap-1 cursor-pointer`}
          onClick={(e) => {
            e.stopPropagation();
            setViewingDocument({ task, document: documentTypes.dataFormat! });
          }}
        >
          <Database className="h-3 w-3" /> Data
          {documentTypes.dataFormat.approvalHierarchy?.status === 'approved' && <CheckCircle className="h-2 w-2 ml-1" />}
        </Badge>
      )}
      {documentTypes.reportFormat && (
        <Badge 
          variant="outline" 
          className={`${
            documentTypes.reportFormat.approvalHierarchy?.status === 'approved' ? 'bg-green-50 text-green-700' : 
            documentTypes.reportFormat.approvalHierarchy?.status === 'rejected' ? 'bg-red-50 text-red-700' : 
            'bg-amber-50 text-amber-700'
          } hover:bg-amber-100 flex items-center gap-1 cursor-pointer`}
          onClick={(e) => {
            e.stopPropagation();
            setViewingDocument({ task, document: documentTypes.reportFormat! });
          }}
        >
          <PieChart className="h-3 w-3" /> Report
          {documentTypes.reportFormat.approvalHierarchy?.status === 'approved' && <CheckCircle className="h-2 w-2 ml-1" />}
        </Badge>
      )}
      {documentTypes.rulesAndProcedures && (
        <Badge 
          variant="outline" 
          className={`${
            documentTypes.rulesAndProcedures.approvalHierarchy?.status === 'approved' ? 'bg-green-50 text-green-700' : 
            documentTypes.rulesAndProcedures.approvalHierarchy?.status === 'rejected' ? 'bg-red-50 text-red-700' : 
            'bg-purple-50 text-purple-700'
          } hover:bg-purple-100 flex items-center gap-1 cursor-pointer`}
          onClick={(e) => {
            e.stopPropagation();
            setViewingDocument({ task, document: documentTypes.rulesAndProcedures! });
          }}
        >
          <BookOpen className="h-3 w-3" /> R&P
          {documentTypes.rulesAndProcedures.approvalHierarchy?.status === 'approved' && <CheckCircle className="h-2 w-2 ml-1" />}
        </Badge>
      )}
    </div>
  );
};
