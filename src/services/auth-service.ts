
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
    // Set a reasonable timeout
    const TIMEOUT_MS = 30000; // 30 seconds
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Signup request timed out after 30 seconds")), TIMEOUT_MS)
    );
    
    // The actual signup request
    const signupPromise = supabase.auth.signUp({
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
    
    // Race between the timeout and the actual signup
    const { error: authError, data } = await Promise.race([
      signupPromise,
      timeoutPromise.then(() => { throw new Error("Signup timeout") })
    ]) as any;

    if (authError) {
      console.error("Auth error during signup:", authError);
      throw authError;
    }
    
    if (!data.user) {
      throw new Error('Failed to create user account');
    }
    
    // Create additional records in a non-blocking way
    // We don't want these operations to block the signup process
    createUserRecordsNonBlocking(data.user.id, email, userData);
    
    toast.success('Sign up successful! Your account is pending approval.');
    return data;
  } catch (error: any) {
    // Handle retry errors specially
    if (error.name === 'AuthRetryableFetchError' || error.message === "Signup timeout" || error.status === 504) {
      console.error("Network timeout during signup. The request may have completed but couldn't be confirmed.");
      
      // We show a different message for timeout since the user might have actually been created
      toast.warning("Signup request timed out. If you don't receive a confirmation email, please try logging in before attempting to sign up again.");
      
      // Return a partial success object that will trigger the completion screen
      // This is because the user might have been created successfully despite the timeout
      return {
        user: { id: 'timeout' },
        session: null,
        error: new Error("Timeout")
      };
    }
    throw error;
  }
};

// Non-blocking version of createUserRecords that doesn't throw errors
const createUserRecordsNonBlocking = async (userId: string, email: string, userData?: any) => {
  try {
    await createUserRecords(userId, email, userData);
  } catch (error) {
    // Log error but don't block the signup flow
    console.error("Error in background user record creation:", error);
    
    // Try to create the records again with individual error handling for each operation
    try {
      // Try to insert approval record
      await supabase.from('account_approvals')
        .insert({
          user_id: userId,
          email: email,
          first_name: userData?.first_name || '',
          last_name: userData?.last_name || '',
          status: 'pending',
          status_code: 'pending',
          created_at: new Date().toISOString()
        });
    } catch (e) {
      console.error("Failed to create approval record in retry:", e);
    }
    
    try {
      // Try to insert profile
      await supabase.from('profiles')
        .insert({
          id: userId,
          first_name: userData?.first_name || '',
          last_name: userData?.last_name || '',
          email: email
        });
    } catch (e) {
      console.error("Failed to create profile in retry:", e);
    }
    
    try {
      // Try to insert employee
      await supabase.from('employees')
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
    } catch (e) {
      console.error("Failed to create employee record in retry:", e);
    }
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

  // Run these in parallel to save time
  const profilePromise = supabase
    .from('profiles')
    .insert({
      id: userId,
      first_name: userData?.first_name || '',
      last_name: userData?.last_name || '',
      email: email
    });
    
  const employeePromise = supabase
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
  
  // Wait for both to complete
  const [profileResult, employeeResult] = await Promise.all([profilePromise, employeePromise]);
  
  if (profileResult.error) {
    console.error("Error creating profile:", profileResult.error);
    throw profileResult.error;
  }
  
  if (employeeResult.error) {
    console.error("Error creating employee record:", employeeResult.error);
    throw employeeResult.error;
  }
  
  console.log("Profile and employee records created successfully");
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
