
import { supabase } from "@/integrations/supabase/client";

export const useTaskDocumentUpload = () => {
  const processTaskDocuments = async (taskId: string, documents: any[]) => {
    try {
      // For each document, create an entry in the documents table
      for (const document of documents) {
        if (!document.file) continue;
        
        // Store the file in Supabase Storage
        const fileName = `${Date.now()}-${document.fileName}`;
        const { data: fileData, error: fileError } = await supabase.storage
          .from('task-documents')
          .upload(`tasks/${taskId}/${fileName}`, document.file);
          
        if (fileError) {
          console.error('Error uploading file:', fileError);
          continue;
        }
        
        // Create document record in the database
        const { error: docError } = await supabase
          .from('documents')
          .insert({
            task_id: taskId,
            file_name: document.fileName,
            file_type: document.fileType,
            document_type: document.documentType,
            version: document.version || '1.0',
            uploaded_by: (await supabase.auth.getUser()).data.user?.id || '00000000-0000-0000-0000-000000000000',
            notes: document.notes
          });
          
        if (docError) {
          console.error('Error creating document record:', docError);
        }
      }
    } catch (error) {
      console.error('Error processing documents:', error);
    }
  };

  return { processTaskDocuments };
};
