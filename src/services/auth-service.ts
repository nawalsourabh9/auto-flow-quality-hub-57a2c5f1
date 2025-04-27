
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const signIn = async (email: string, password: string) => {
  const { data: approvalData, error: approvalError } = await supabase
    .from('account_approvals')
    .select('status_code')
    .eq('email', email)
    .single();

  if (approvalError && approvalError.code !== 'PGRST116') {
    throw approvalError;
  }

  if (approvalData) {
    if (approvalData.status_code === 'pending') {
      throw new Error('Your account is still pending admin approval.');
    } else if (approvalData.status_code === 'rejected') {
      throw new Error('Your account request was rejected. Please contact support.');
    } else if (approvalData.status_code === 'inactive') {
      throw new Error('Your account has been deactivated. Please contact support.');
    }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
};

export const signUp = async (email: string, password: string, userData?: any) => {
  console.log("Starting signup process with data:", { email, userData });
  
  try {
    const { error: authError, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...userData,
          approved: false,
        },
        emailRedirectTo: `${window.location.origin}/login`
      }
    });

    if (authError) {
      console.error("Auth error during signup:", authError);
      throw authError;
    }
    
    if (!data.user) {
      throw new Error('Failed to create user account');
    }
    
    await createUserRecords(data.user.id, email, userData);
    
    toast.success('Sign up successful! Your account is pending approval. You will receive an email when approved.');
    return data;
  } catch (error: any) {
    // Handle retry errors specially
    if (error.name === 'AuthRetryableFetchError' || error.status === 504) {
      console.error("Network timeout during signup. The request may have completed but couldn't be confirmed.");
      toast.error("Network timeout. Please check if your account was created before trying again.");
      throw new Error("Network timeout. Your signup may have been processed but we couldn't confirm it. Please try logging in or contact support.");
    }
    throw error;
  }
};

const createUserRecords = async (userId: string, email: string, userData?: any) => {
  console.log("Auth user created successfully with ID:", userId);
  
  const { error: approvalError } = await supabase
    .from('account_approvals')
    .insert({
      user_id: userId,
      email: email,
      first_name: userData?.first_name || '',
      last_name: userData?.last_name || '',
      status: 'pending',
      status_code: 'pending',
      created_at: new Date().toISOString()
    });
  
  if (approvalError) {
    console.error("Error creating approval record:", approvalError);
    throw approvalError;
  }
  
  console.log("Account approval entry created successfully");

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      first_name: userData?.first_name || '',
      last_name: userData?.last_name || '',
      email: email
    });
  
  if (profileError) {
    console.error("Error creating profile:", profileError);
    throw profileError;
  }
  
  console.log("Profile created successfully");
  
  const { error: employeeError } = await supabase
    .from('employees')
    .insert({
      user_id: userId,
      name: `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim(),
      email: email,
      employee_id: `EMP-${Math.floor(100000 + Math.random() * 900000)}`,
      department: 'Unassigned',
      position: 'New Employee',
      role: 'user',
      status: 'Pending'
    });
  
  if (employeeError) {
    console.error("Error creating employee record:", employeeError);
    throw employeeError;
  }
  
  console.log("Employee record created successfully");
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  toast.success('Signed out successfully');
};

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/update-password',
  });

  if (error) throw error;
  toast.success('Password reset instructions sent to your email');
};

export const updatePassword = async (password: string) => {
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) throw error;
  toast.success('Password updated successfully');
};

export const updateProfile = async (data: { first_name?: string; last_name?: string; email?: string }, userId: string) => {
  if (!userId) {
    throw new Error('No user logged in');
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: {
      first_name: data.first_name,
      last_name: data.last_name,
    },
  });

  if (authError) throw authError;

  if (data.email) {
    const { error: emailError } = await supabase.auth.updateUser({
      email: data.email,
    });
    
    if (emailError) throw emailError;
    toast.info('Email verification sent to your new email address');
  }

  const { error: functionError } = await supabase.functions.invoke('database-utils', {
    body: {
      operation: 'updateProfile',
      userId: userId,
      data: {
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        email: data.email || '',
      },
    },
  });

  if (functionError) throw functionError;
  toast.success('Profile updated successfully');
};

export const changePassword = async (currentPassword: string, newPassword: string, userEmail: string) => {
  if (!userEmail) {
    throw new Error('No user logged in');
  }

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: userEmail,
    password: currentPassword
  });

  if (authError) throw authError;

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (updateError) throw updateError;
  toast.success('Password updated successfully');
};
