
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash, UserPlus, Search, Phone, Mail, User } from "lucide-react";
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
import { TeamMember } from "@/types/task";

interface TeamMembersListProps {
  departmentId: number;
  departmentName: string;
  teamMembers: TeamMember[];
  onAddMember: (member: Omit<TeamMember, "id">) => void;
  onUpdateMember: (member: TeamMember) => void;
  onDeleteMember: (memberId: number) => void;
}

export function TeamMembersList({
  departmentId,
  departmentName,
  teamMembers,
  onAddMember,
  onUpdateMember,
  onDeleteMember
}: TeamMembersListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [supervisors, setSupervisors] = useState<TeamMember[]>([]);
  const [newMember, setNewMember] = useState<Omit<TeamMember, "id">>({
    name: "",
    email: "",
    position: "",
    department: departmentId,
    initials: "",
    phone: "",
    supervisorId: null
  });

  useEffect(() => {
    setSupervisors(teamMembers);
    setNewMember(prev => ({
      ...prev,
      department: departmentId
    }));
  }, [teamMembers, departmentId]);

  const generateInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSupervisorName = (supervisorId: number | null): string => {
    if (!supervisorId) return "None";
    const supervisor = teamMembers.find(member => member.id === supervisorId);
    return supervisor ? supervisor.name : "Unknown";
  };

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email || !newMember.position) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const memberWithInitials = {
      ...newMember,
      initials: newMember.initials || generateInitials(newMember.name)
    };

    onAddMember(memberWithInitials);
    setIsAddDialogOpen(false);
    setNewMember({
      name: "",
      email: "",
      position: "",
      department: departmentId,
      initials: "",
      phone: "",
      supervisorId: null
    });
    
    // Make sure localStorage is updated for Users page to see changes
    const existingEmployees = localStorage.getItem('employees');
    if (existingEmployees) {
      try {
        const employees = JSON.parse(existingEmployees);
        // This will be handled by the parent component's effect
        // so we don't need to update localStorage here
      } catch (error) {
        console.error("Error parsing employees from localStorage", error);
      }
    }
    
    toast({
      title: "Team Member Added",
      description: `${newMember.name} has been added to ${departmentName}.`
    });
  };

  const handleUpdateMember = () => {
    if (!memberToEdit) return;

    onUpdateMember({
      ...memberToEdit,
      initials: memberToEdit.initials || generateInitials(memberToEdit.name)
    });
    setIsEditDialogOpen(false);
    toast({
      title: "Team Member Updated",
      description: `${memberToEdit.name}'s information has been updated.`
    });
  };

  const handleDeleteMember = () => {
    if (!memberToDelete) return;

    onDeleteMember(memberToDelete.id);
    setIsDeleteDialogOpen(false);
    toast({
      title: "Team Member Removed",
      description: `${memberToDelete.name} has been removed from ${departmentName}.`,
      variant: "destructive"
    });
  };

  const filteredMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.phone && member.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Team Members</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search team members..." 
              className="pl-8 h-9 w-[200px] rounded-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            size="sm" 
            onClick={() => setIsAddDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add Member
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        <table className="w-full border-collapse">
          <thead>
            <tr className="excel-header border-b border-border text-left">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Phone</th>
              <th className="px-4 py-2 font-medium">Position</th>
              <th className="px-4 py-2 font-medium">Reports To</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-muted-foreground">
                  No team members found. Add team members to this department.
                </td>
              </tr>
            ) : (
              filteredMembers.map(member => (
                <tr key={member.id} className="border-b border-border">
                  <td className="px-4 py-3 flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-2 text-xs font-medium">
                      {member.initials}
                    </div>
                    {member.name}
                  </td>
                  <td className="px-4 py-3">{member.email}</td>
                  <td className="px-4 py-3">{member.phone || "-"}</td>
                  <td className="px-4 py-3">{member.position}</td>
                  <td className="px-4 py-3">{getSupervisorName(member.supervisorId)}</td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="excel-button h-8 w-8 p-0" 
                        onClick={() => {
                          setMemberToEdit(member);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="excel-button h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600" 
                        onClick={() => {
                          setMemberToDelete(member);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  Full Name
                </label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="email" className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="phone" className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={newMember.phone || ""}
                  onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="position">Position</label>
                <Input
                  id="position"
                  placeholder="Enter job position"
                  value={newMember.position}
                  onChange={(e) => setNewMember({...newMember, position: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="supervisor">Reports To</label>
                <Select
                  value={newMember.supervisorId?.toString() || "none"}
                  onValueChange={(value) => setNewMember({
                    ...newMember, 
                    supervisorId: value && value !== "none" ? parseInt(value) : null
                  })}
                >
                  <SelectTrigger id="supervisor">
                    <SelectValue placeholder="Select supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {supervisors.map(supervisor => (
                      <SelectItem key={supervisor.id} value={supervisor.id.toString()}>
                        {supervisor.name} - {supervisor.position}
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
            <Button onClick={handleAddMember}>Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="editName" className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  Full Name
                </label>
                <Input
                  id="editName"
                  placeholder="Enter full name"
                  value={memberToEdit?.name || ""}
                  onChange={(e) => memberToEdit && setMemberToEdit({...memberToEdit, name: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="editEmail" className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  Email
                </label>
                <Input
                  id="editEmail"
                  type="email"
                  placeholder="Enter email address"
                  value={memberToEdit?.email || ""}
                  onChange={(e) => memberToEdit && setMemberToEdit({...memberToEdit, email: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="editPhone" className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  Phone Number
                </label>
                <Input
                  id="editPhone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={memberToEdit?.phone || ""}
                  onChange={(e) => memberToEdit && setMemberToEdit({...memberToEdit, phone: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="editPosition">Position</label>
                <Input
                  id="editPosition"
                  placeholder="Enter job position"
                  value={memberToEdit?.position || ""}
                  onChange={(e) => memberToEdit && setMemberToEdit({...memberToEdit, position: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="editSupervisor">Reports To</label>
                <Select
                  value={memberToEdit?.supervisorId?.toString() || "none"}
                  onValueChange={(value) => memberToEdit && setMemberToEdit({
                    ...memberToEdit, 
                    supervisorId: value && value !== "none" ? parseInt(value) : null
                  })}
                >
                  <SelectTrigger id="editSupervisor">
                    <SelectValue placeholder="Select supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {supervisors
                      .filter(supervisor => supervisor.id !== memberToEdit?.id)
                      .map(supervisor => (
                        <SelectItem key={supervisor.id} value={supervisor.id.toString()}>
                          {supervisor.name} - {supervisor.position}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateMember}>Update Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to remove <strong>{memberToDelete?.name}</strong> from this department?</p>
            <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteMember}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
