
import { z } from "zod";

export const employeeFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  role: z.string().min(1, { message: "Please select a role." }),
  department: z.string().min(1, { message: "Please select a department." }),
  employeeId: z.string().min(1, { message: "Employee ID is required." }),
  position: z.string().min(1, { message: "Position is required." }),
  status: z.enum(["Active", "Inactive", "Pending"], { message: "Please select a status." }),
  phone: z.string().optional(),
  supervisorId: z.string().optional()
});

export type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  employeeId: string;
  position: string;
  status: "Active" | "Inactive" | "Pending";
  phone?: string;
  supervisorId?: string;
  created_at?: string;
  updated_at?: string;
};

export const departmentOptions = [
  "Executive", 
  "Quality", 
  "Production", 
  "Engineering", 
  "HR", 
  "Finance", 
  "IT", 
  "Sales", 
  "Marketing", 
  "Business Development",
  "Quality Assurance",
  "Quality Control",
  "Research & Development",
  "Customer Service",
  "Legal"
];

export const roleOptions = ["Admin", "Manager", "User", "Viewer"];
