
import { supabase } from '@/integrations/supabase/client';
import { ApprovalRecord } from '@/types/auth';
import { toast } from "sonner";

export async function checkApprovalStatus(user_id: string, email: string): Promise<{ approved: boolean; message: string }> {
  // First check user metadata for approval status
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError) throw userError;
  
  // If the user has the approved flag set to true in their metadata, they're approved
  if (userData.user.user_metadata?.approved === true) {
    return { approved: true, message: 'Account approved' };
  }
  
  // If not explicitly approved in metadata, check the account_approvals table
  const { data: approvalData, error: approvalError } = await supabase
    .from('account_approvals')
    .select('status')
    .eq('user_id', user_id)
    .single() as { data: ApprovalRecord | null, error: any };
  
  if (approvalError && approvalError.code !== 'PGRST116') {
    throw approvalError;
  }
  
  // If no approval record or status is not 'approved', the user is not approved
  if (!approvalData || approvalData.status !== 'approved') {
    return { 
      approved: false, 
      message: 'Your account is pending approval. Please check back later or contact an administrator.' 
    };
  }
  
  return { approved: true, message: 'Account approved' };
}

export async function handleUserApproval(userId: string, approved: boolean) {
  const status = approved ? 'approved' : 'rejected';
  const action = approved ? 'approved' : 'rejected';
  
  // Update the approval status in the database
  const { error: updateError } = await supabase
    .from('account_approvals')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('user_id', userId);
  
  if (updateError) throw updateError;

  // If approving, update the user metadata
  if (approved) {
    const { error: adminUpdateError } = await supabase.functions.invoke('database-utils', {
      body: {
        operation: 'updateUserApproval',
        userId: userId,
        approved: true
      },
    });
    
    if (adminUpdateError) throw adminUpdateError;
  }

  // Get user email for notification
  const { data: userData, error: userError } = await supabase
    .from('account_approvals')
    .select('email')
    .eq('user_id', userId)
    .single() as { data: { email: string } | null, error: any };

  if (userError) throw userError;

  // Send notification email if we have the email
  if (userData && userData.email) {
    const subject = approved ? 'Your Account Has Been Approved' : 'Your Account Registration Status';
    const body = approved 
      ? 'Your account has been approved. You can now log in to the system.'
      : 'We regret to inform you that your account registration request has been declined. Please contact the administrator for more information.';

    await supabase.functions.invoke('send-email', {
      body: {
        to: userData.email,
        subject,
        body,
        isHtml: false
      }
    });
  }

  toast.success(`User ${action} successfully`);
}
