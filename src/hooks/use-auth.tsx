import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData?: any) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateProfile: (data: { first_name?: string; last_name?: string; email?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  checkUserApprovalStatus: () => Promise<{ approved: boolean; message: string }>;
}

interface ApprovalRecord {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // First check account status
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
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Starting sign up process for:", email);
      
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...userData,
            approved: false, // Mark new user as not approved
          }
        }
      });

      if (error) throw error;
      
      console.log("Auth sign up successful, user data:", data.user);
      
      // Create an account approval request
      if (data.user) {
        console.log("Creating approval request for user:", data.user.id);
        
        // Use a more type-safe approach for the insert operation
        const { error: dbError, data: approvalData } = await supabase
          .from('account_approvals')
          .insert({
            user_id: data.user.id,
            email: email,
            first_name: userData?.first_name || '',
            last_name: userData?.last_name || '',
            status: 'pending',
            created_at: new Date().toISOString()
          } as any)
          .select(); // Add .select() to return the inserted data
        
        if (dbError) {
          console.error("Error creating approval record:", dbError);
          throw dbError;
        }
        
        console.log("Approval record created successfully:", approvalData);
      }
      
      toast.success('Sign up successful! Your account is pending approval. You will receive an email when approved.');
    } catch (error: any) {
      console.error("Sign up error:", error);
      setError(error.message);
      toast.error(`Sign up failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      
      toast.success('Signed out successfully');
    } catch (error: any) {
      setError(error.message);
      toast.error(`Sign out failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/update-password',
      });

      if (error) throw error;
      
      toast.success('Password reset instructions sent to your email');
    } catch (error: any) {
      setError(error.message);
      toast.error(`Password reset failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;
      
      toast.success('Password updated successfully');
    } catch (error: any) {
      setError(error.message);
      toast.error(`Password update failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: { first_name?: string; last_name?: string; email?: string }) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error('No user logged in');
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
        },
      });

      if (authError) throw authError;

      if (data.email && data.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email,
        });
        
        if (emailError) throw emailError;
        toast.info('Email verification sent to your new email address');
      }

      const { error: functionError } = await supabase.functions.invoke('database-utils', {
        body: {
          operation: 'updateProfile',
          userId: user.id,
          data: {
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            email: data.email || user.email || '',
          },
        },
      });

      if (functionError) throw functionError;
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      setError(error.message);
      toast.error(`Profile update failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = user;
      if (!currentUser || !currentUser.email) {
        throw new Error('No user logged in');
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword
      });

      if (authError) throw authError;

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;
      
      toast.success('Password updated successfully');
    } catch (error: any) {
      setError(error.message);
      toast.error(`Password update failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkUserApprovalStatus = async (): Promise<{ approved: boolean; message: string }> => {
    try {
      if (!user) {
        return { approved: false, message: 'No user logged in' };
      }
      
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
        .eq('user_id', user.id)
        .single() as { data: ApprovalRecord | null, error: any };
      
      if (approvalError && approvalError.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
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
    } catch (error: any) {
      console.error('Error checking approval status:', error);
      return { approved: false, message: 'Error checking account status' };
    }
  };

  const approveUser = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Update the approval status in the database
      const { error: updateError } = await supabase
        .from('account_approvals')
        .update({ 
          status: 'approved', 
          updated_at: new Date().toISOString() 
        } as any)
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
      
      // Update the user metadata to include approved status
      const { error: adminUpdateError } = await supabase.functions.invoke('database-utils', {
        body: {
          operation: 'updateUserApproval',
          userId: userId,
          approved: true
        },
      });
      
      if (adminUpdateError) throw adminUpdateError;

      // Get user email for notification
      const { data: userData, error: userError } = await supabase
        .from('account_approvals')
        .select('email')
        .eq('user_id', userId)
        .single() as { data: { email: string } | null, error: any };

      if (userError) throw userError;

      // Send an approval notification email if we have the email
      if (userData && userData.email) {
        await supabase.functions.invoke('send-email', {
          body: {
            to: userData.email,
            subject: 'Your Account Has Been Approved',
            body: 'Your account has been approved. You can now log in to the system.',
            isHtml: false
          }
        });
      }
      
      toast.success('User approved successfully');
    } catch (error: any) {
      setError(error.message);
      toast.error(`User approval failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const rejectUser = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Update the approval status in the database
      const { error: updateError } = await supabase
        .from('account_approvals')
        .update({ 
          status: 'rejected', 
          updated_at: new Date().toISOString() 
        } as any)
        .eq('user_id', userId);
      
      if (updateError) throw updateError;

      // Get user email for notification
      const { data: userData, error: userError } = await supabase
        .from('account_approvals')
        .select('email')
        .eq('user_id', userId)
        .single() as { data: { email: string } | null, error: any };

      if (userError) throw userError;

      // Send a rejection notification email if we have the email
      if (userData && userData.email) {
        await supabase.functions.invoke('send-email', {
          body: {
            to: userData.email,
            subject: 'Your Account Registration Status',
            body: 'We regret to inform you that your account registration request has been declined. Please contact the administrator for more information.',
            isHtml: false
          }
        });
      }
      
      toast.success('User rejected successfully');
    } catch (error: any) {
      setError(error.message);
      toast.error(`User rejection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        signIn,
        signUp,
        signOut,
        loading,
        error,
        resetPassword,
        updatePassword,
        updateProfile,
        changePassword,
        approveUser,
        rejectUser,
        checkUserApprovalStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
