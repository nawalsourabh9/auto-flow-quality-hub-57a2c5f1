
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useTaskDocumentUpload = () => {
  const processTaskDocuments = async (taskId: string, documents: any[]) => {
    if (!documents || documents.length === 0) {
      console.log("No documents to process for task", taskId);
      return;
    }

    try {
      console.log(`Processing ${documents.length} documents for task ${taskId}`);
      
      // For each document, create an entry in the documents table
      for (const document of documents) {
        if (!document.file) {
          console.log(`No file for document type ${document.documentType}, skipping upload`);
          continue;
        }
        
        console.log(`Processing document: ${document.fileName}, type: ${document.documentType}`);
        
        // Upload file to the existing task-documents bucket
        // No need to check/create bucket as it's now already created via SQL
        const fileName = `${Date.now()}-${document.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = `tasks/${taskId}/${fileName}`;
        
        console.log(`Uploading file ${fileName} to path ${filePath}`);
        
        const { data: fileData, error: fileError } = await supabase.storage
          .from('task-documents')
          .upload(filePath, document.file);
          
        if (fileError) {
          console.error('Error uploading file:', fileError);
          toast({
            title: "Upload failed",
            description: `Failed to upload file: ${fileError.message}`,
            variant: "destructive"
          });
          continue;
        }
        
        console.log('File uploaded successfully, path:', fileData?.path);
        
        // Show success toast
        toast({
          title: "File uploaded",
          description: `${document.fileName} was successfully uploaded.`
        });
        
        // Get the current user for uploaded_by field
        const { data: { user } } = await supabase.auth.getUser();
        const uploaderId = user?.id || 'unknown';
        
        // Create document record in the database - removed file_path field which doesn't exist in the schema
        const { data, error: docError } = await supabase
          .from('documents')
          .insert({
            task_id: taskId,
            file_name: document.fileName,
            file_type: document.fileType,
            document_type: document.documentType,
            version: document.version || '1.0',
            uploaded_by: uploaderId,
            notes: document.notes || ''
          })
          .select();
          
        if (docError) {
          console.error('Error creating document record:', docError);
          toast({
            title: "Error",
            description: `Failed to save document reference: ${docError.message}`,
            variant: "destructive"
          });
        } else if (data && data.length > 0) {
          console.log('Document record created successfully');
          
          // Now create an entry in document_revisions table with the file path
          const { data: revData, error: revisionError } = await supabase
            .from('document_revisions')
            .insert({
              document_id: data[0].id,
              file_name: document.fileName,
              file_path: filePath,
              version: document.version || '1.0',
              uploaded_by: uploaderId,
              notes: document.notes || ''
            })
            .select();
            
          if (revisionError) {
            console.error('Error creating document revision record:', revisionError);
            toast({
              title: "Warning",
              description: `Document saved but revision tracking failed: ${revisionError.message}`,
              variant: "destructive"
            });
          } else if (revData && revData.length > 0) {
            console.log('Document revision record created successfully');
            
            // Update the document with the current revision ID
            const { error: updateError } = await supabase
              .from('documents')
              .update({ current_revision_id: revData[0].id })
              .eq('id', data[0].id);
              
            if (updateError) {
              console.error('Error updating document with revision ID:', updateError);
            } else {
              console.log('Document updated with current revision ID');
            }
          }
        }
      }
      
      console.log(`Completed processing ${documents.length} documents for task ${taskId}`);
    } catch (error: any) {
      console.error('Error processing documents:', error);
      toast({
        title: "Error",
        description: `Failed to process documents: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  return { processTaskDocuments };
};
