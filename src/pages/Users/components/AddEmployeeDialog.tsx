
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmployeeForm } from "./EmployeeForm";
import { employeeFormSchema, Employee } from "../types";

interface AddEmployeeDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSubmit: (data: Omit<Employee, "id">) => void;
  employees: Employee[];
}

export function AddEmployeeDialog({ isOpen, setIsOpen, onSubmit, employees }: AddEmployeeDialogProps) {
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

  const handleSubmit = (data: Omit<Employee, "id">) => {
    onSubmit(data);
    form.reset();
  };

  const handleCancel = () => {
    setIsOpen(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <EmployeeForm 
          form={form} 
          onSubmit={handleSubmit}
          submitButtonText="Add Employee"
          onCancel={handleCancel}
          employees={employees}
        />
      </DialogContent>
    </Dialog>
  );
}
