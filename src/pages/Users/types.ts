
import { z } from "zod";

export const employeeFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  role: z.string().min(1, { message: "Please select a role." }),
  department: z.string().min(1, { message: "Please select a department." }),
  employeeId: z.string().min(1, { message: "Employee ID is required." }),
  position: z.string().min(1, { message: "Position is required." }),
  status: z.enum(["Active", "Inactive"], { message: "Please select a status." }),
  phone: z.string().optional(),
  supervisorId: z.number().optional()
});

export type Employee = z.infer<typeof employeeFormSchema> & { id: number };

// Ensures all departments are consistent across the application
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
