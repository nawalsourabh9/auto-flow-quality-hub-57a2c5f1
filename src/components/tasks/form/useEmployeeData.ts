
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  employee_id: string;
}

export const useEmployeeData = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      try {
        // Check the foreign key constraint on tasks table
        const { data: tableInfo, error: tableError } = await supabase
          .rpc('exec_sql', {
            sql_query: "SELECT pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE conname = 'tasks_assignee_fkey'"
          });
          
        console.log("Foreign key constraint definition:", tableInfo);
        
        // Fetch employees data
        const { data, error } = await supabase
          .from('employees')
          .select('id, name, email, department, position, employee_id')
          .order('name');
          
        if (error) throw error;
        setEmployees(data || []);
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEmployees();
  }, []);

  return { employees, isLoading };
};
