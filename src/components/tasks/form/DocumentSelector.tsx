
import React, { useRef, useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, Database, PieChart, BookOpen, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  const fileInputRefs = {
    sop: useRef<HTMLInputElement>(null),
    dataFormat: useRef<HTMLInputElement>(null),
    reportFormat: useRef<HTMLInputElement>(null),
    rulesAndProcedures: useRef<HTMLInputElement>(null)
  };

  // For tracking if files are selected
  const [fileStatuses, setFileStatuses] = useState({
    sop: !!documentUploads.sop.file,
    dataFormat: !!documentUploads.dataFormat.file,
    reportFormat: !!documentUploads.reportFormat.file,
    rulesAndProcedures: !!documentUploads.rulesAndProcedures.file
  });

  // Update file statuses when documentUploads changes
  useEffect(() => {
    setFileStatuses({
      sop: !!documentUploads.sop.file,
      dataFormat: !!documentUploads.dataFormat.file,
      reportFormat: !!documentUploads.reportFormat.file,
      rulesAndProcedures: !!documentUploads.rulesAndProcedures.file
    });
  }, [documentUploads]);

  const handleFileChange = (
    docType: "sop" | "dataFormat" | "reportFormat" | "rulesAndProcedures", 
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;
    
    if (file) {
      console.log(`File selected for ${docType}:`, file.name);
      toast({
        title: "File selected",
        description: `${file.name} successfully selected for upload.`
      });
      
      // Update the file status
      setFileStatuses(prev => ({
        ...prev,
        [docType]: true
      }));
    } else {
      console.log(`No file selected for ${docType}`);
      
      // Update the file status
      setFileStatuses(prev => ({
        ...prev,
        [docType]: false
      }));
    }
    
    onFileUpload(docType, file);
  };

  const handleCheckboxChange = (
    docType: "sop" | "dataFormat" | "reportFormat" | "rulesAndProcedures",
    checked: boolean
  ) => {
    onDocumentSelect(docType, checked);
    
    // If unchecked, clear the file input
    if (!checked && fileInputRefs[docType].current) {
      fileInputRefs[docType].current.value = "";
      onFileUpload(docType, null);
      
      // Update the file status
      setFileStatuses(prev => ({
        ...prev,
        [docType]: false
      }));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="border border-input rounded-md p-3">
        <div className="flex items-center gap-2 mb-2">
          <Checkbox 
            id="docSOP" 
            checked={documentUploads.sop.selected} 
            onCheckedChange={checked => handleCheckboxChange("sop", checked === true)} 
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
              ref={fileInputRefs.sop}
              onChange={e => handleFileChange("sop", e)} 
              className="flex-1 text-xs" 
            />
            {fileStatuses.sop ? (
              <Upload size={16} className="text-green-500" />
            ) : (
              <Upload size={16} className="text-muted-foreground" />
            )}
          </div>
        )}
      </div>
      
      <div className="border border-input rounded-md p-3">
        <div className="flex items-center gap-2 mb-2">
          <Checkbox 
            id="docDataFormat" 
            checked={documentUploads.dataFormat.selected} 
            onCheckedChange={checked => handleCheckboxChange("dataFormat", checked === true)} 
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
              ref={fileInputRefs.dataFormat}
              onChange={e => handleFileChange("dataFormat", e)} 
              className="flex-1 text-xs" 
            />
            {fileStatuses.dataFormat ? (
              <Upload size={16} className="text-green-500" />
            ) : (
              <Upload size={16} className="text-muted-foreground" />
            )}
          </div>
        )}
      </div>
      
      <div className="border border-input rounded-md p-3">
        <div className="flex items-center gap-2 mb-2">
          <Checkbox 
            id="docReportFormat" 
            checked={documentUploads.reportFormat.selected} 
            onCheckedChange={checked => handleCheckboxChange("reportFormat", checked === true)} 
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
              ref={fileInputRefs.reportFormat}
              onChange={e => handleFileChange("reportFormat", e)} 
              className="flex-1 text-xs" 
            />
            {fileStatuses.reportFormat ? (
              <Upload size={16} className="text-green-500" />
            ) : (
              <Upload size={16} className="text-muted-foreground" />
            )}
          </div>
        )}
      </div>
      
      <div className="border border-input rounded-md p-3">
        <div className="flex items-center gap-2 mb-2">
          <Checkbox 
            id="docRulesProc" 
            checked={documentUploads.rulesAndProcedures.selected} 
            onCheckedChange={checked => handleCheckboxChange("rulesAndProcedures", checked === true)} 
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
              ref={fileInputRefs.rulesAndProcedures}
              onChange={e => handleFileChange("rulesAndProcedures", e)} 
              className="flex-1 text-xs" 
            />
            {fileStatuses.rulesAndProcedures ? (
              <Upload size={16} className="text-green-500" />
            ) : (
              <Upload size={16} className="text-muted-foreground" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
