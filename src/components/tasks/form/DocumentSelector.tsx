
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, Database, PieChart, BookOpen, Upload } from "lucide-react";

interface DocumentUploads {
  sop: {
    selected: boolean;
    file: File | null;
  };
  dataFormat: {
    selected: boolean;
    file: File | null;
  };
  reportFormat: {
    selected: boolean;
    file: File | null;
  };
  rulesAndProcedures: {
    selected: boolean;
    file: File | null;
  };
}

interface DocumentSelectorProps {
  documentUploads: DocumentUploads;
  onDocumentSelect: (docType: "sop" | "dataFormat" | "reportFormat" | "rulesAndProcedures", selected: boolean) => void;
  onFileUpload: (docType: "sop" | "dataFormat" | "reportFormat" | "rulesAndProcedures", file: File | null) => void;
}

export const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  documentUploads,
  onDocumentSelect,
  onFileUpload
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="border border-input rounded-md p-3">
        <div className="flex items-center gap-2 mb-2">
          <Checkbox 
            id="docSOP" 
            checked={documentUploads.sop.selected} 
            onCheckedChange={checked => onDocumentSelect("sop", checked === true)} 
          />
          <Label htmlFor="docSOP" className="flex items-center">
            <FileText className="h-4 w-4 text-green-500 mr-2" />
            Standard Operating Procedure
          </Label>
        </div>
        
        {documentUploads.sop.selected && (
          <div className="ml-6 mt-2 flex gap-2 items-center">
            <Input 
              type="file" 
              id="sopFile" 
              onChange={e => onFileUpload("sop", e.target.files?.[0] || null)} 
              className="flex-1 text-xs" 
            />
            <Upload size={16} className="text-muted-foreground" />
          </div>
        )}
      </div>
      
      <div className="border border-input rounded-md p-3">
        <div className="flex items-center gap-2 mb-2">
          <Checkbox 
            id="docDataFormat" 
            checked={documentUploads.dataFormat.selected} 
            onCheckedChange={checked => onDocumentSelect("dataFormat", checked === true)} 
          />
          <Label htmlFor="docDataFormat" className="flex items-center">
            <Database className="h-4 w-4 text-blue-500 mr-2" />
            Data Recording Format
          </Label>
        </div>
        
        {documentUploads.dataFormat.selected && (
          <div className="ml-6 mt-2 flex gap-2 items-center">
            <Input 
              type="file" 
              id="dataFormatFile" 
              onChange={e => onFileUpload("dataFormat", e.target.files?.[0] || null)} 
              className="flex-1 text-xs" 
            />
            <Upload size={16} className="text-muted-foreground" />
          </div>
        )}
      </div>
      
      <div className="border border-input rounded-md p-3">
        <div className="flex items-center gap-2 mb-2">
          <Checkbox 
            id="docReportFormat" 
            checked={documentUploads.reportFormat.selected} 
            onCheckedChange={checked => onDocumentSelect("reportFormat", checked === true)} 
          />
          <Label htmlFor="docReportFormat" className="flex items-center">
            <PieChart className="h-4 w-4 text-amber-500 mr-2" />
            Report Format
          </Label>
        </div>
        
        {documentUploads.reportFormat.selected && (
          <div className="ml-6 mt-2 flex gap-2 items-center">
            <Input 
              type="file" 
              id="reportFormatFile" 
              onChange={e => onFileUpload("reportFormat", e.target.files?.[0] || null)} 
              className="flex-1 text-xs" 
            />
            <Upload size={16} className="text-muted-foreground" />
          </div>
        )}
      </div>
      
      <div className="border border-input rounded-md p-3">
        <div className="flex items-center gap-2 mb-2">
          <Checkbox 
            id="docRulesProc" 
            checked={documentUploads.rulesAndProcedures.selected} 
            onCheckedChange={checked => onDocumentSelect("rulesAndProcedures", checked === true)} 
          />
          <Label htmlFor="docRulesProc" className="flex items-center">
            <BookOpen className="h-4 w-4 text-purple-500 mr-2" />
            Rules and Procedures
          </Label>
        </div>
        
        {documentUploads.rulesAndProcedures.selected && (
          <div className="ml-6 mt-2 flex gap-2 items-center">
            <Input 
              type="file" 
              id="rulesProcFile" 
              onChange={e => onFileUpload("rulesAndProcedures", e.target.files?.[0] || null)} 
              className="flex-1 text-xs" 
            />
            <Upload size={16} className="text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
};
