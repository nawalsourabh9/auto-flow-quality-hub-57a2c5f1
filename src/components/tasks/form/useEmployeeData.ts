
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
        console.log("Fetching employee data for task assignment...");
        
        // Fetch employees data directly without attempting to check constraint definition
        const { data, error } = await supabase
          .from('employees')
          .select('id, name, email, department, position, employee_id')
          .order('name');
          
        if (error) {
          console.error("Error fetching employees:", error);
          throw error;
        }
        
        console.log("Successfully fetched employee data:", data?.length || 0, "records");
        setEmployees(data || []);
      } catch (error) {
        console.error("Error in useEmployeeData hook:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEmployees();
  }, []);

  return { employees, isLoading };
};
