import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { EmployeeList } from "./components/EmployeeList";
import { EditEmployeeDialog } from "./components/EditEmployeeDialog";
import { DeleteEmployeeDialog } from "./components/DeleteEmployeeDialog";
import { UsersHeader } from "./components/UsersHeader";
import { useEmployees } from "./hooks/useEmployees";
import { Employee } from "./types";

const Users = () => {
  const { employees, loading, updateEmployee, deleteEmployee } = useEmployees();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleEditEmployee = async (data: Omit<Employee, "id">) => {
    if (!editingEmployee) return;
    
    try {
      await updateEmployee(editingEmployee.id, data);
      setIsEditDialogOpen(false);
      setEditingEmployee(null);
      
      toast({
        title: "Employee Updated",
        description: "The employee details have been successfully updated."
      });
    } catch (error) {
      console.error("Failed to update employee:", error);
    }
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const handleDeleteEmployee = async () => {
    if (employeeToDelete !== null) {
      try {
        await deleteEmployee(employeeToDelete);
        setIsDeleteDialogOpen(false);
        setEmployeeToDelete(null);
        
        toast({
          title: "Employee Removed",
          description: "The employee has been successfully removed from the system.",
          variant: "destructive"
        });
      } catch (error) {
        console.error("Failed to delete employee:", error);
      }
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Employee Management</h1>
        <p className="text-muted-foreground">Add, edit and manage employee information</p>
      </div>
      
      <Card className="border-border">
        <UsersHeader searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <CardContent className="p-0">
          <EmployeeList 
            employees={filteredEmployees}
            openEditDialog={openEditDialog}
            setEmployeeToDelete={setEmployeeToDelete}
            setIsDeleteDialogOpen={setIsDeleteDialogOpen}
          />
        </CardContent>
      </Card>

      <EditEmployeeDialog 
        isOpen={isEditDialogOpen} 
        setIsOpen={setIsEditDialogOpen}
        employee={editingEmployee}
        onSubmit={handleEditEmployee}
        employees={employees}
      />

      <DeleteEmployeeDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        onConfirm={handleDeleteEmployee}
      />
    </div>
  );
};

export default Users;
