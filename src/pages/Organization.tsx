
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, FolderTree, List, LayoutList } from "lucide-react";
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
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";

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
  const [viewMode, setViewMode] = useState<"list" | "tree">("list"); // New state for view toggle

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

  // Render tree view item for the visual tree representation
  const renderTreeViewItem = (department: Department) => {
    const childDepartments = findChildDepartments(department.id);
    
    return (
      <div key={department.id} className="mb-2">
        <Collapsible 
          defaultOpen={expandedDepartments.includes(department.id)}
          onOpenChange={(isOpen) => {
            if (isOpen) {
              setExpandedDepartments(prev => 
                prev.includes(department.id) ? prev : [...prev, department.id]
              );
            } else {
              setExpandedDepartments(prev => 
                prev.filter(id => id !== department.id)
              );
            }
          }}
        >
          <div className="flex items-center">
            {childDepartments.length > 0 ? (
              <CollapsibleTrigger className="flex items-center text-muted-foreground hover:text-foreground">
                <div className="w-6 h-6 rounded-full border border-border flex items-center justify-center mr-2">
                  {expandedDepartments.includes(department.id) ? (
                    <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor"></path>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64949 10.6151 7.84182L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49985L6.1356 3.84182C5.94673 3.64036 5.95694 3.32394 6.1584 3.13508Z" fill="currentColor"></path>
                    </svg>
                  )}
                </div>
              </CollapsibleTrigger>
            ) : (
              <div className="w-6 h-6 mr-2"></div>
            )}
            
            <div className="p-2 border border-border rounded-md flex-1 bg-background hover:bg-muted/20 transition-colors">
              <div className="font-medium">{department.name}</div>
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">{department.description}</div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Manager:</span> {getManagerName(department.managerId)}
                </div>
              </div>
            </div>
          </div>

          {childDepartments.length > 0 && (
            <CollapsibleContent>
              <div className="pl-6 border-l border-dashed border-border mt-1 ml-3">
                {childDepartments.map(child => renderTreeViewItem(child))}
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
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
            <div className="border rounded-md flex">
              <Button 
                size="sm" 
                variant={viewMode === "list" ? "secondary" : "ghost"} 
                className="rounded-r-none px-3 h-9"
                onClick={() => setViewMode("list")}
              >
                <LayoutList className="h-4 w-4 mr-1" />
                List View
              </Button>
              <Button 
                size="sm" 
                variant={viewMode === "tree" ? "secondary" : "ghost"} 
                className="rounded-l-none px-3 h-9"
                onClick={() => setViewMode("tree")}
              >
                <FolderTree className="h-4 w-4 mr-1" />
                Tree View
              </Button>
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
          {viewMode === "list" ? (
            <div className="org-chart border-border">
              {rootDepartments.map(dept => renderDepartmentTree(dept))}
            </div>
          ) : (
            <div className="org-tree p-4">
              {rootDepartments.map(dept => renderTreeViewItem(dept))}
            </div>
          )}
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
