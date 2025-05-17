
import { useState, useEffect } from 'react';
import { TaskDocument } from "@/types/document";

export interface DocumentUpload {
  selected: boolean;
  file: File | null;
}

export interface DocumentUploads {
  sop: DocumentUpload;
  dataFormat: DocumentUpload;
  reportFormat: DocumentUpload;
  rulesAndProcedures: DocumentUpload;
}

export const useDocumentUploads = (initialDocuments?: TaskDocument[]) => {
  const [documentUploads, setDocumentUploads] = useState<DocumentUploads>({
    sop: {
      selected: false,
      file: null
    },
    dataFormat: {
      selected: false,
      file: null
    },
    reportFormat: {
      selected: false,
      file: null
    },
    rulesAndProcedures: {
      selected: false,
      file: null
    }
  });

  // Initialize from existing documents if provided
  useEffect(() => {
    if (initialDocuments && initialDocuments.length > 0) {
      console.log("Initializing document uploads from:", initialDocuments);
      
      const newDocumentUploads = { ...documentUploads };
      
      initialDocuments.forEach(doc => {
        if (doc.documentType === 'sop') {
          newDocumentUploads.sop.selected = true;
        } else if (doc.documentType === 'dataFormat') {
          newDocumentUploads.dataFormat.selected = true;
        } else if (doc.documentType === 'reportFormat') {
          newDocumentUploads.reportFormat.selected = true;
        } else if (doc.documentType === 'rulesAndProcedures') {
          newDocumentUploads.rulesAndProcedures.selected = true;
        }
      });
      
      setDocumentUploads(newDocumentUploads);
      console.log("Document uploads initialized:", newDocumentUploads);
    }
  }, [initialDocuments]);

  const handleDocumentSelect = (
    docType: "sop" | "dataFormat" | "reportFormat" | "rulesAndProcedures", 
    selected: boolean
  ) => {
    console.log(`Document ${docType} selected: ${selected}`);
    setDocumentUploads(prev => ({
      ...prev,
      [docType]: {
        ...prev[docType],
        selected
      }
    }));
  };

  const handleFileUpload = (
    docType: "sop" | "dataFormat" | "reportFormat" | "rulesAndProcedures", 
    file: File | null
  ) => {
    console.log(`File uploaded for ${docType}:`, file?.name || "No file selected");
    setDocumentUploads(prev => ({
      ...prev,
      [docType]: {
        ...prev[docType],
        file
      }
    }));
  };

  return {
    documentUploads,
    handleDocumentSelect,
    handleFileUpload
  };
};
