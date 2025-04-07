
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, FolderTree } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

// Define department types
interface Department {
  id: number;
  name: string;
  managerId: number | null;
  parentDepartmentId: number | null;
  description: string;
}

// Mock initial data for departments
const initialDepartments: Department[] = [
  { id: 1, name: "Executive", managerId: 1, parentDepartmentId: null, description: "Executive Leadership Team" },
  { id: 2, name: "Quality", managerId: 2, parentDepartmentId: 1, description: "Quality Management Department" },
  { id: 3, name: "Production", managerId: 3, parentDepartmentId: 1, description: "Production and Manufacturing" },
  { id: 4, name: "Engineering", managerId: 4, parentDepartmentId: 1, description: "Product Engineering" },
  { id: 5, name: "HR", managerId: 5, parentDepartmentId: 1, description: "Human Resources" },
  { id: 6, name: "Finance", managerId: 6, parentDepartmentId: 1, description: "Finance and Accounting" },
  { id: 7, name: "Quality Assurance", managerId: 7, parentDepartmentId: 2, description: "Quality Assurance Team" },
  { id: 8, name: "Quality Control", managerId: 8, parentDepartmentId: 2, description: "Quality Control Team" },
];

// Mock data for managers (using IDs from the existing employee data)
const managers = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Smith" },
  { id: 3, name: "Robert Johnson" },
  { id: 4, name: "Emily Davis" },
  { id: 5, name: "Michael Brown" },
  { id: 6, name: "Sarah Wilson" },
  { id: 7, name: "David Thompson" },
  { id: 8, name: "Lisa Anderson" },
];

const Organization = () => {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDepartment, setNewDepartment] = useState<Partial<Department>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDepartments, setExpandedDepartments] = useState<number[]>([1]); // Default expand executive

  // Find children of a department
  const findChildDepartments = (departmentId: number) => {
    return departments.filter(dept => dept.parentDepartmentId === departmentId);
  };

  // Find manager name
  const getManagerName = (managerId: number | null) => {
    if (!managerId) return "Unassigned";
    const manager = managers.find(m => m.id === managerId);
    return manager ? manager.name : "Unassigned";
  };

  // Toggle department expansion
  const toggleDepartment = (departmentId: number) => {
    setExpandedDepartments(prev => 
      prev.includes(departmentId) 
        ? prev.filter(id => id !== departmentId) 
        : [...prev, departmentId]
    );
  };

  // Handle adding a new department
  const handleAddDepartment = () => {
    if (!newDepartment.name) {
      toast({
        title: "Error",
        description: "Department name is required",
        variant: "destructive"
      });
      return;
    }

    const newDept: Department = {
      id: departments.length + 1,
      name: newDepartment.name || "",
      managerId: newDepartment.managerId || null,
      parentDepartmentId: newDepartment.parentDepartmentId || null,
      description: newDepartment.description || ""
    };

    setDepartments([...departments, newDept]);
    setNewDepartment({});
    setIsAddDialogOpen(false);
    toast({
      title: "Department Added",
      description: `${newDept.name} has been added to the organization.`
    });
  };

  // Filter departments by search term
  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    dept.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get root departments (those without parent)
  const rootDepartments = filteredDepartments.filter(dept => dept.parentDepartmentId === null);

  // Recursively render department tree
  const renderDepartmentTree = (department: Department, level: number = 0) => {
    const childDepartments = findChildDepartments(department.id);
    const isExpanded = expandedDepartments.includes(department.id);
    
    return (
      <div key={department.id} className="department-item">
        <div 
          className={`flex items-center p-3 border-b border-border ${level > 0 ? 'ml-6' : ''}`}
          style={{ paddingLeft: `${level * 12 + 12}px` }}
        >
          {childDepartments.length > 0 && (
            <button 
              onClick={() => toggleDepartment(department.id)}
              className="mr-2 h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? "▼" : "►"}
            </button>
          )}
          {!childDepartments.length && <span className="mr-2 w-5"></span>}
          
          <div className="flex-1">
            <div className="font-medium">{department.name}</div>
            <div className="text-sm text-muted-foreground">{department.description}</div>
          </div>
          
          <div className="text-sm">
            Manager: <span className="font-medium">{getManagerName(department.managerId)}</span>
          </div>
        </div>
        
        {isExpanded && childDepartments.map(child => renderDepartmentTree(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Company Organization</h1>
        <p className="text-muted-foreground">View and manage organizational structure</p>
      </div>
      
      <Card className="border-border">
        <CardHeader className="excel-header flex flex-row items-center justify-between py-2">
          <CardTitle className="text-lg flex items-center">
            <FolderTree className="mr-2 h-5 w-5" /> 
            Organization Structure
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search departments..." 
                className="pl-8 h-9 w-[200px] rounded-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button size="sm" variant="outline" className="excel-button">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button 
              size="sm" 
              className="bg-primary hover:bg-primary/90"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Department
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="org-chart border-border">
            {rootDepartments.map(dept => renderDepartmentTree(dept))}
          </div>
        </CardContent>
      </Card>

      {/* Add Department Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="name">Department Name</label>
                <Input
                  id="name"
                  placeholder="Enter department name"
                  value={newDepartment.name || ""}
                  onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="description">Description</label>
                <Input
                  id="description"
                  placeholder="Brief description"
                  value={newDepartment.description || ""}
                  onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <label>Parent Department</label>
                <Select
                  value={newDepartment.parentDepartmentId?.toString() || ""}
                  onValueChange={(value) => setNewDepartment({...newDepartment, parentDepartmentId: value ? parseInt(value) : null})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (Top Level)</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <label>Department Manager</label>
                <Select
                  value={newDepartment.managerId?.toString() || ""}
                  onValueChange={(value) => setNewDepartment({...newDepartment, managerId: value ? parseInt(value) : null})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {managers.map(manager => (
                      <SelectItem key={manager.id} value={manager.id.toString()}>
                        {manager.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddDepartment}>Add Department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Organization;
