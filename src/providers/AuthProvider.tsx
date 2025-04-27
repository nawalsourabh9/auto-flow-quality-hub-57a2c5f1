import React, { createContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AuthContextType } from '@/types/auth';
import { checkApprovalStatus, handleUserApproval } from '@/utils/auth-utils';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state change event:", event);
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
      
      console.log("Starting signup process with data:", { email, userData });
      
      // 1. Create the auth user
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
      
      console.log("Auth user created successfully with ID:", data.user.id);
      
      // 2. Create account approval entry
      const { error: approvalError } = await supabase
        .from('account_approvals')
        .insert({
          user_id: data.user.id,
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

      // 3. Create profile entry
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          first_name: userData?.first_name || '',
          last_name: userData?.last_name || '',
          email: email
        });
      
      if (profileError) {
        console.error("Error creating profile:", profileError);
        throw profileError;
      }
      
      console.log("Profile created successfully");
      
      // 4. Create employee entry with basic information
      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          user_id: data.user.id,
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
      
      toast.success('Sign up successful! Your account is pending approval. You will receive an email when approved.');
      return data;
    } catch (error: any) {
      setError(error.message);
      console.error("Signup error:", error);
      toast.error(`Sign up failed: ${error.message}`);
      throw error; // Rethrow to allow component to handle it
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

      if (!user?.email) {
        throw new Error('No user logged in');
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
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

  const checkUserApprovalStatus = async () => {
    if (!user) {
      return { approved: false, message: 'No user logged in' };
    }
    return checkApprovalStatus(user.id, user.email || '');
  };

  const approveUser = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      await handleUserApproval(userId, true);
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
      await handleUserApproval(userId, false);
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
