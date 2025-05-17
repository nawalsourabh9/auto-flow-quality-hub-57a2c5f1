
import { supabase } from "@/integrations/supabase/client";

export const useTaskDocumentUpload = () => {
  const processTaskDocuments = async (taskId: string, documents: any[]) => {
    try {
      console.log(`Processing ${documents.length} documents for task ${taskId}`);
      
      // For each document, create an entry in the documents table
      for (const document of documents) {
        if (!document.file) {
          console.log(`No file for document type ${document.documentType}, skipping upload`);
          continue;
        }
        
        console.log(`Processing document: ${document.fileName}, type: ${document.documentType}`);
        
        // First check if the task-documents bucket exists, if not create it
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(bucket => bucket.name === 'task-documents');
        
        if (!bucketExists) {
          console.log("Creating task-documents storage bucket");
          await supabase.storage.createBucket('task-documents', { public: false });
        }
        
        // Store the file in Supabase Storage with a unique name
        const fileName = `${Date.now()}-${document.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = `tasks/${taskId}/${fileName}`;
        
        console.log(`Uploading file ${fileName} to path ${filePath}`);
        
        const { data: fileData, error: fileError } = await supabase.storage
          .from('task-documents')
          .upload(filePath, document.file);
          
        if (fileError) {
          console.error('Error uploading file:', fileError);
          continue;
        }
        
        console.log('File uploaded successfully, path:', fileData?.path);
        
        // Get the current user for uploaded_by field
        const { data: { user } } = await supabase.auth.getUser();
        const uploaderId = user?.id || 'unknown';
        
        // Create document record in the database
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .insert({
            task_id: taskId,
            file_name: document.fileName,
            file_type: document.fileType,
            document_type: document.documentType,
            version: document.version || '1.0',
            uploaded_by: uploaderId,
            notes: document.notes || ''
          });
          
        if (docError) {
          console.error('Error creating document record:', docError);
        } else {
          console.log('Document record created successfully');
        }
      }
      
      console.log(`Completed processing ${documents.length} documents for task ${taskId}`);
    } catch (error) {
      console.error('Error processing documents:', error);
    }
  };

  return { processTaskDocuments };
};
