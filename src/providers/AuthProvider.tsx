
import React, { createContext } from 'react';
import { AuthContextType } from '@/types/auth';
import { useAuthSession } from '@/hooks/use-auth-session';
import * as authService from '@/services/auth-service';
import * as approvalService from '@/services/approval-service';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, user, loading, error, setError, setLoading } = useAuthSession();

  const handleAsyncOperation = async <T,>(operation: () => Promise<T>): Promise<T> => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      return result;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    session,
    user,
    loading,
    error,
    signIn: (email: string, password: string) => 
      handleAsyncOperation(async () => {
        await authService.signIn(email, password);
      }),
    signUp: (email: string, password: string, userData?: any) =>
      handleAsyncOperation(async () => {
        await authService.signUp(email, password, userData);
        // Return a placeholder that matches the expected return type
        return { user: null, session: null };
      }),
    signOut: () => handleAsyncOperation(authService.signOut),
    resetPassword: (email: string) => 
      handleAsyncOperation(() => authService.resetPassword(email)),
    updatePassword: (password: string) => 
      handleAsyncOperation(() => authService.updatePassword(password)),
    updateProfile: (data: { first_name?: string; last_name?: string; email?: string }) => 
      handleAsyncOperation(() => authService.updateProfile(data, user?.id || '')),
    changePassword: (currentPassword: string, newPassword: string) => 
      handleAsyncOperation(() => authService.changePassword(currentPassword, newPassword, user?.email || '')),
    approveUser: (userId: string) => 
      handleAsyncOperation(() => approvalService.approveUser(userId)),
    rejectUser: (userId: string) => 
      handleAsyncOperation(() => approvalService.rejectUser(userId)),
    checkUserApprovalStatus: () => 
      handleAsyncOperation(() => approvalService.checkUserApprovalStatus(user?.id || '', user?.email || '')),
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
