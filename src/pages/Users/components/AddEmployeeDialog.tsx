
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmployeeForm } from "./EmployeeForm";
import { employeeFormSchema, Employee } from "../types";

interface AddEmployeeDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSubmit: (data: Omit<Employee, "id">) => void;
}

export function AddEmployeeDialog({ isOpen, setIsOpen, onSubmit }: AddEmployeeDialogProps) {
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
        />
        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={form.handleSubmit(handleSubmit)}>Add Employee</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
