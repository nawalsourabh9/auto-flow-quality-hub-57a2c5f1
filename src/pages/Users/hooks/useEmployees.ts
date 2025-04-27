
import { useState, useEffect } from "react";
import { Employee } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) throw error;

      setEmployees(data.map(emp => ({
        ...emp,
        id: parseInt(emp.id), // Convert UUID to number for compatibility
      })));
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading = false;
    }
  };

  const addEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([employeeData])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast.error('An employee with this email already exists');
        } else {
          toast.error('Failed to add employee');
        }
        throw error;
      }

      setEmployees(prev => [...prev, { ...data, id: parseInt(data.id) }]);
      return data;
    } catch (error) {
      console.error('Error adding employee:', error);
      throw error;
    }
  };

  const updateEmployee = async (id: number, updates: Partial<Employee>) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setEmployees(prev => 
        prev.map(emp => emp.id === id ? { ...emp, ...data } : emp)
      );
      return data;
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee');
      throw error;
    }
  };

  const deleteEmployee = async (id: number) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEmployees(prev => prev.filter(emp => emp.id !== id));
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
      throw error;
    }
  };

  return { 
    employees, 
    loading, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee,
    refetch: fetchEmployees
  };
};
