
import { useState, useEffect } from "react";
import { Employee } from "../types";

const initialEmployees: Employee[] = [
  { 
    id: 1, 
    name: "John Doe", 
    email: "john.doe@example.com", 
    role: "Admin", 
    department: "Quality", 
    status: "Active", 
    employeeId: "EMP001", 
    position: "Quality Manager",
    phone: "+1 (555) 123-4567",
    supervisorId: undefined
  },
  { id: 2, name: "Jane Smith", email: "jane.smith@example.com", role: "Manager", department: "Production", status: "Active", employeeId: "EMP002", position: "Production Lead" },
  { id: 3, name: "Robert Johnson", email: "robert.johnson@example.com", role: "User", department: "Engineering", status: "Inactive", employeeId: "EMP003", position: "Design Engineer" },
];

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  // Load employees from localStorage on component mount and on regular intervals
  useEffect(() => {
    const loadEmployees = () => {
      const storedEmployees = localStorage.getItem('employees');
      const currentTime = Date.now();
      
      if (storedEmployees) {
        const parsedEmployees = JSON.parse(storedEmployees);
        if (currentTime > lastSyncTime) {
          setEmployees(parsedEmployees);
          setLastSyncTime(currentTime);
        }
      } else {
        setEmployees(initialEmployees);
        localStorage.setItem('employees', JSON.stringify(initialEmployees));
        setLastSyncTime(currentTime);
      }
    };
    
    loadEmployees();
    const intervalId = setInterval(loadEmployees, 2000);
    return () => clearInterval(intervalId);
  }, [lastSyncTime]);

  // Save employees to localStorage whenever they change
  useEffect(() => {
    if (employees.length > 0) {
      const currentTime = Date.now();
      localStorage.setItem('employees', JSON.stringify(employees));
      setLastSyncTime(currentTime);
    }
  }, [employees]);

  return { employees, setEmployees };
};
