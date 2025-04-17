import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Filter } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EmployeeList } from "./components/EmployeeList";
import { AddEmployeeDialog } from "./components/AddEmployeeDialog";
import { EditEmployeeDialog } from "./components/EditEmployeeDialog";
import { DeleteEmployeeDialog } from "./components/DeleteEmployeeDialog";
import { Employee } from "./types";

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

const Users = () => {
  const [employees, setEmployees] = useState(initialEmployees);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const handleAddEmployee = (data: Omit<Employee, "id">) => {
    const newEmployee: Employee = {
      id: employees.length + 1,
      ...data
    };
    setEmployees([...employees, newEmployee]);
    setIsAddDialogOpen(false);
    toast({
      title: "Employee Added",
      description: "The employee has been successfully added to the system."
    });
  };

  const handleEditEmployee = (data: Omit<Employee, "id">) => {
    if (!editingEmployee) return;
    
    setEmployees(employees.map(emp => 
      emp.id === editingEmployee.id ? { ...data, id: emp.id } : emp
    ));
    setIsEditDialogOpen(false);
    setEditingEmployee(null);
    toast({
      title: "Employee Updated",
      description: "The employee details have been successfully updated."
    });
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const handleDeleteEmployee = () => {
    if (employeeToDelete !== null) {
      setEmployees(employees.filter(emp => emp.id !== employeeToDelete));
      setIsDeleteDialogOpen(false);
      setEmployeeToDelete(null);
      toast({
        title: "Employee Removed",
        description: "The employee has been successfully removed from the system.",
        variant: "destructive"
      });
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
        <CardHeader className="excel-header flex flex-row items-center justify-between py-2">
          <CardTitle className="text-lg">Employees</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search employees..." 
                className="pl-8 h-9 w-[200px] rounded-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              size="sm" 
              className="bg-primary hover:bg-primary/90"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Add Employee
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <EmployeeList 
            employees={filteredEmployees}
            openEditDialog={openEditDialog}
            setEmployeeToDelete={setEmployeeToDelete}
            setIsDeleteDialogOpen={setIsDeleteDialogOpen}
          />
        </CardContent>
      </Card>

      <AddEmployeeDialog 
        isOpen={isAddDialogOpen} 
        setIsOpen={setIsAddDialogOpen}
        onSubmit={handleAddEmployee}
      />

      <EditEmployeeDialog 
        isOpen={isEditDialogOpen} 
        setIsOpen={setIsEditDialogOpen}
        employee={editingEmployee}
        onSubmit={handleEditEmployee}
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
