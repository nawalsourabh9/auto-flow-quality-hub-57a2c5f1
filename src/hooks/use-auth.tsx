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
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      toast.error(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) throw error;
      
      toast.success('Sign up successful! Please check your email for verification and then login.');
    } catch (error: any) {
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

      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
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
        changePassword
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
