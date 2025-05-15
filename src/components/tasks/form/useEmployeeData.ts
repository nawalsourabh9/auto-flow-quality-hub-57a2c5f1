
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
        
        // Make sure we get all necessary fields and fetch only active employees
        const { data, error } = await supabase
          .from('employees')
          .select('id, name, email, department, position, employee_id, status')
          .eq('status', 'Active') // Only fetch active employees
          .order('name');
          
        if (error) {
          console.error("Error fetching employees:", error);
          throw error;
        }
        
        console.log("Successfully fetched employee data:", data?.length || 0, "records");
        console.log("Employee data sample:", data?.[0]);
        
        // Filter out any potential null values just to be safe
        const validEmployees = (data || []).filter(emp => emp && emp.id);
        setEmployees(validEmployees);
        
        // Log all employee IDs for debugging
        console.log("All employee IDs:", validEmployees.map(emp => emp.id));
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
