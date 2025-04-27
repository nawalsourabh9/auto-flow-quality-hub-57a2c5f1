
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as bcrypt from 'bcryptjs';

// Define an interface for the employee type that includes password_hash
interface Employee {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  employee_id: string;
  department: string;
  position: string;
  role: string;
  status: string;
  phone?: string;
  supervisor_id?: string;
  created_at?: string;
  updated_at?: string;
}

export const signIn = async (email: string, password: string) => {
  const { data: employee, error } = await supabase
    .from('employees')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    throw new Error('Invalid email or password');
  }

  // Check if password_hash exists on the employee record
  if (!employee || !('password_hash' in employee)) {
    throw new Error('Invalid email or password');
  }

  // Now we can safely access password_hash
  const passwordMatch = await bcrypt.compare(password, employee.password_hash);
  if (!passwordMatch) {
    throw new Error('Invalid email or password');
  }

  return { employee };
};

export const signUp = async (email: string, password: string, userData: any) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { data: employee, error } = await supabase
      .from('employees')
      .insert({
        email,
        password_hash: hashedPassword,
        name: `${userData.first_name} ${userData.last_name}`.trim(),
        employee_id: `EMP-${Math.floor(100000 + Math.random() * 900000)}`,
        department: 'Unassigned',
        position: 'New Employee',
        role: 'user',
        status: 'Pending'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('An account with this email already exists');
      }
      throw error;
    }

    toast.success('Account created successfully!');
    return { employee };
  } catch (error: any) {
    console.error('Error in signup:', error);
    throw error;
  }
};

export const signOut = async () => {
  // Clear any session data or local storage if needed
  localStorage.removeItem('employee');
  toast.success('Signed out successfully');
};

// Add these stub methods to fix TypeScript errors in AuthProvider.tsx
export const resetPassword = async (email: string): Promise<void> => {
  console.warn('resetPassword not implemented');
};

export const updatePassword = async (password: string): Promise<void> => {
  console.warn('updatePassword not implemented');
};

export const updateProfile = async (data: any, userId: string): Promise<void> => {
  console.warn('updateProfile not implemented');
};

export const changePassword = async (currentPassword: string, newPassword: string, email: string): Promise<void> => {
  console.warn('changePassword not implemented');
};
