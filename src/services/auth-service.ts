
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as bcrypt from 'bcryptjs';

export const signIn = async (email: string, password: string) => {
  const { data: employee, error } = await supabase
    .from('employees')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    throw new Error('Invalid email or password');
  }

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
