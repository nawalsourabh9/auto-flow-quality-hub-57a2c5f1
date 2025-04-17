
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmployeeForm } from "./EmployeeForm";
import { Employee, employeeFormSchema } from "../types";
import { useEffect } from "react";

interface EditEmployeeDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  employee: Employee | null;
  onSubmit: (data: Omit<Employee, "id">) => void;
  employees: Employee[];
}

export function EditEmployeeDialog({ isOpen, setIsOpen, employee, onSubmit, employees }: EditEmployeeDialogProps) {
  const form = useForm<Omit<Employee, "id">>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "",
      department: "",
      employeeId: "",
      position: "",
      status: "Active"
    }
  });

  // Reset form when employee changes
  useEffect(() => {
    if (employee) {
      form.reset({
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        employeeId: employee.employeeId,
        position: employee.position,
        status: employee.status,
        phone: employee.phone,
        supervisorId: employee.supervisorId
      });
    }
  }, [employee, form]);

  const handleSubmit = (data: Omit<Employee, "id">) => {
    onSubmit(data);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>
        <EmployeeForm 
          form={form} 
          onSubmit={handleSubmit}
          submitButtonText="Update Employee"
          onCancel={handleCancel}
          employees={employees}
        />
      </DialogContent>
    </Dialog>
  );
}
