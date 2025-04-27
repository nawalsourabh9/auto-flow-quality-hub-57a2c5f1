
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const checkUserApprovalStatus = async (userId: string, email: string) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError) throw userError;
  
  if (userData.user.user_metadata?.approved === true) {
    return { approved: true, message: 'Account approved' };
  }
  
  const { data: approvalData, error: approvalError } = await supabase
    .from('account_approvals')
    .select('status')
    .eq('user_id', userId)
    .single();
  
  if (approvalError && approvalError.code !== 'PGRST116') {
    throw approvalError;
  }
  
  if (!approvalData || approvalData.status !== 'approved') {
    return { 
      approved: false, 
      message: 'Your account is pending approval. Please check back later or contact an administrator.' 
    };
  }
  
  return { approved: true, message: 'Account approved' };
};

export const approveUser = async (userId: string) => {
  await handleUserApproval(userId, true);
};

export const rejectUser = async (userId: string) => {
  await handleUserApproval(userId, false);
};

const handleUserApproval = async (userId: string, approved: boolean) => {
  const status = approved ? 'approved' : 'rejected';
  
  const { error: updateError } = await supabase
    .from('account_approvals')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('user_id', userId);
  
  if (updateError) throw updateError;

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

  const { data: userData, error: userError } = await supabase
    .from('account_approvals')
    .select('email')
    .eq('user_id', userId)
    .single();

  if (userError) throw userError;

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

  toast.success(`User ${approved ? 'approved' : 'rejected'} successfully`);
};
