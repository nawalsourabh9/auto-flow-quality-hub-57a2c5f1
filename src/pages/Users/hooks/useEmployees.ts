
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

      // Map database fields to our Employee type
      const formattedEmployees: Employee[] = data.map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        department: emp.department,
        employeeId: emp.employee_id,
        position: emp.position,
        status: emp.status as "Active" | "Inactive",
        phone: emp.phone || undefined,
        supervisorId: emp.supervisor_id || undefined,
        created_at: emp.created_at,
        updated_at: emp.updated_at,
        user_id: emp.user_id
      }));

      setEmployees(formattedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false); 
    }
  };

  const addEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    try {
      // Convert from our Employee type to database schema
      const dbEmployee = {
        name: employeeData.name,
        email: employeeData.email,
        role: employeeData.role,
        department: employeeData.department,
        employee_id: employeeData.employeeId,
        position: employeeData.position,
        status: employeeData.status,
        phone: employeeData.phone,
        supervisor_id: employeeData.supervisorId
      };

      const { data, error } = await supabase
        .from('employees')
        .insert([dbEmployee])
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

      // Map the response back to our Employee type
      const newEmployee: Employee = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department,
        employeeId: data.employee_id,
        position: data.position,
        status: data.status as "Active" | "Inactive",
        phone: data.phone || undefined,
        supervisorId: data.supervisor_id || undefined,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id
      };

      setEmployees(prev => [...prev, newEmployee]);
      return newEmployee;
    } catch (error) {
      console.error('Error adding employee:', error);
      throw error;
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      // Convert from our Employee type to database schema
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.email) dbUpdates.email = updates.email;
      if (updates.role) dbUpdates.role = updates.role;
      if (updates.department) dbUpdates.department = updates.department;
      if (updates.employeeId) dbUpdates.employee_id = updates.employeeId;
      if (updates.position) dbUpdates.position = updates.position;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.supervisorId !== undefined) dbUpdates.supervisor_id = updates.supervisorId;

      const { data, error } = await supabase
        .from('employees')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Map the response back to our Employee type
      const updatedEmployee: Employee = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department,
        employeeId: data.employee_id,
        position: data.position,
        status: data.status as "Active" | "Inactive",
        phone: data.phone || undefined,
        supervisorId: data.supervisor_id || undefined,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id
      };

      setEmployees(prev => 
        prev.map(emp => emp.id === id ? updatedEmployee : emp)
      );
      return updatedEmployee;
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee');
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
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
