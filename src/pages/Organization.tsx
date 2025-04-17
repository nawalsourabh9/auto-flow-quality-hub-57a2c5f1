
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, FolderTree, List, LayoutList, Users } from "lucide-react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { TeamMembersList } from "@/components/organization/TeamMembersList";
import { TeamMember } from "@/types/task";
import { departmentOptions } from "@/pages/Users/types";
import { Employee } from "@/pages/Users/types";

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

// Convert employee to team member format
const convertEmployeeToTeamMember = (employee: Employee): TeamMember => {
  // Generate initials from name
  const initials = employee.name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  // Map department name to department ID
  const departmentMap: Record<string, number> = {
    "Executive": 1,
    "Quality": 2,
    "Production": 3,
    "Engineering": 4,
    "HR": 5,
    "Finance": 6,
    "Quality Assurance": 7,
    "Quality Control": 8,
    "IT": 9,
    "Sales": 10,
    "Marketing": 11,
    "Business Development": 12
  };
  
  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    position: employee.position,
    department: departmentMap[employee.department] || 1, // Default to Executive if not found
    initials: initials,
    phone: employee.phone
  };
};

// Convert team member to employee format
const convertTeamMemberToEmployee = (teamMember: TeamMember): Employee => {
  // Map department ID to department name
  const departmentMap: Record<number, string> = {
    1: "Executive",
    2: "Quality", 
    3: "Production",
    4: "Engineering",
    5: "HR",
    6: "Finance",
    7: "Quality Assurance",
    8: "Quality Control",
    9: "IT",
    10: "Sales",
    11: "Marketing",
    12: "Business Development"
  };

  return {
    id: teamMember.id,
    name: teamMember.name,
    email: teamMember.email,
    position: teamMember.position,
    department: departmentMap[teamMember.department] || "Executive",
    status: "Active", // Default status
    employeeId: `EMP${String(teamMember.id).padStart(3, '0')}`,
    phone: teamMember.phone,
    role: "User" // Default role
  };
};

const Organization = () => {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDepartment, setNewDepartment] = useState<Partial<Department>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDepartments, setExpandedDepartments] = useState<number[]>([1]); // Default expand executive
  const [viewMode, setViewMode] = useState<"list" | "tree">("list"); // State for view toggle
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null); // For team members view

  // Load employees from localStorage
  useEffect(() => {
    const storedEmployees = localStorage.getItem('employees');
    if (storedEmployees) {
      const loadedEmployees = JSON.parse(storedEmployees);
      setEmployees(loadedEmployees);
      
      // Convert employees to team members format
      const convertedTeamMembers = loadedEmployees.map(convertEmployeeToTeamMember);
      setTeamMembers(convertedTeamMembers);
    }
  }, []);

  // Save team members to localStorage by converting back to employees format
  useEffect(() => {
    if (teamMembers.length > 0) {
      // Only save when there are actual changes to avoid empty arrays
      const convertedEmployees = teamMembers.map(convertTeamMemberToEmployee);
      
      // Merge with existing employees to preserve additional fields
      const mergedEmployees = mergeEmployeesData(convertedEmployees, employees);
      
      localStorage.setItem('employees', JSON.stringify(mergedEmployees));
      setEmployees(mergedEmployees);
    }
  }, [teamMembers]);

  // Merge converted team members with existing employees data
  const mergeEmployeesData = (convertedEmployees: Employee[], existingEmployees: Employee[]): Employee[] => {
    const employeeMap = new Map<number, Employee>();
    
    // First add all existing employees to the map
    existingEmployees.forEach(emp => {
      employeeMap.set(emp.id, emp);
    });
    
    // Then update or add the converted employees
    convertedEmployees.forEach(emp => {
      if (employeeMap.has(emp.id)) {
        // Preserve fields that might not be in TeamMember
        const existing = employeeMap.get(emp.id)!;
        employeeMap.set(emp.id, {
          ...existing,
          name: emp.name,
          email: emp.email,
          position: emp.position,
          department: emp.department,
          phone: emp.phone
        });
      } else {
        employeeMap.set(emp.id, emp);
      }
    });
    
    return Array.from(employeeMap.values());
  };

  // Find children of a department
  const findChildDepartments = (departmentId: number) => {
    return departments.filter(dept => dept.parentDepartmentId === departmentId);
  };

  // Find manager name
  const getManagerName = (managerId: number | null) => {
    if (!managerId) return "Unassigned";
    const employee = employees.find(emp => emp.id === managerId);
    return employee ? employee.name : "Unassigned";
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

  // Team members functions
  const getDepartmentTeamMembers = (departmentId: number) => {
    return teamMembers.filter(member => member.department === departmentId);
  };

  const handleAddTeamMember = (newMember: Omit<TeamMember, "id">) => {
    // Find the highest ID and increment by 1 for new member
    const highestId = teamMembers.reduce((max, member) => (member.id > max ? member.id : max), 0);
    const member: TeamMember = {
      ...newMember,
      id: highestId + 1
    };
    setTeamMembers([...teamMembers, member]);
    
    toast({
      title: "Team Member Added",
      description: `${member.name} has been added to the organization.`
    });
  };

  const handleUpdateTeamMember = (updatedMember: TeamMember) => {
    setTeamMembers(teamMembers.map(member => 
      member.id === updatedMember.id ? updatedMember : member
    ));
  };

  const handleDeleteTeamMember = (memberId: number) => {
    setTeamMembers(teamMembers.filter(member => member.id !== memberId));
  };

  // Get department name by ID
  const getDepartmentName = (departmentId: number) => {
    const department = departments.find(dept => dept.id === departmentId);
    return department ? department.name : "Unknown Department";
  };

  // Recursively render department tree
  const renderDepartmentTree = (department: Department, level: number = 0) => {
    const childDepartments = findChildDepartments(department.id);
    const isExpanded = expandedDepartments.includes(department.id);
    const departmentMembers = getDepartmentTeamMembers(department.id);
    
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
          
          <div className="text-sm flex items-center gap-3">
            <span>
              Manager: <span className="font-medium">{getManagerName(department.managerId)}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              {departmentMembers.length} members
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 flex items-center gap-1"
              onClick={() => setSelectedDepartment(department.id)}
            >
              <Users className="h-3.5 w-3.5" />
              Manage Team
            </Button>
          </div>
        </div>
        
        {isExpanded && childDepartments.map(child => renderDepartmentTree(child, level + 1))}
      </div>
    );
  };

  // Render tree view item for the visual tree representation
  const renderTreeViewItem = (department: Department) => {
    const childDepartments = findChildDepartments(department.id);
    const departmentMembers = getDepartmentTeamMembers(department.id);
    
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
                <div className="flex items-center gap-2">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Manager:</span> {getManagerName(department.managerId)}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs px-2"
                    onClick={() => setSelectedDepartment(department.id)}
                  >
                    <Users className="h-3 w-3 mr-1" />
                    <span className="whitespace-nowrap">{departmentMembers.length} members</span>
                  </Button>
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
                    <SelectItem value="none">None (Top Level)</SelectItem>
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
                    <SelectItem value="none">Unassigned</SelectItem>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name} - {emp.position}
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

      {/* Team Members Dialog */}
      <Dialog open={selectedDepartment !== null} onOpenChange={(isOpen) => !isOpen && setSelectedDepartment(null)}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDepartment !== null && getDepartmentName(selectedDepartment)} - Team Members
            </DialogTitle>
          </DialogHeader>
          
          {selectedDepartment !== null && (
            <TeamMembersList
              departmentId={selectedDepartment}
              departmentName={getDepartmentName(selectedDepartment)}
              teamMembers={getDepartmentTeamMembers(selectedDepartment)}
              onAddMember={handleAddTeamMember}
              onUpdateMember={handleUpdateTeamMember}
              onDeleteMember={handleDeleteTeamMember}
            />
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Organization;
