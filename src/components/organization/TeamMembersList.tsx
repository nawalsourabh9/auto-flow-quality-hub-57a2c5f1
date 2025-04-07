
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash, UserPlus, Search, X } from "lucide-react";
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

// Define props for TeamMembersList component
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
  const [newMember, setNewMember] = useState<Omit<TeamMember, "id">>({
    name: "",
    email: "",
    position: "",
    department: departmentId,
    initials: ""
  });

  // Generate initials from name
  const generateInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle adding a new team member
  const handleAddMember = () => {
    if (!newMember.name || !newMember.email || !newMember.position) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Generate initials if not provided
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
      initials: ""
    });
    
    toast({
      title: "Team Member Added",
      description: `${newMember.name} has been added to ${departmentName}.`
    });
  };

  // Handle updating a team member
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

  // Handle deleting a team member
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

  // Filter team members based on search term
  const filteredMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.position.toLowerCase().includes(searchTerm.toLowerCase())
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
              <th className="px-4 py-2 font-medium">Position</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">
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
                  <td className="px-4 py-3">{member.position}</td>
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

      {/* Add Member Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="name">Full Name</label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="email">Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
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

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="editName">Full Name</label>
                <Input
                  id="editName"
                  placeholder="Enter full name"
                  value={memberToEdit?.name || ""}
                  onChange={(e) => memberToEdit && setMemberToEdit({...memberToEdit, name: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="editEmail">Email</label>
                <Input
                  id="editEmail"
                  type="email"
                  placeholder="Enter email address"
                  value={memberToEdit?.email || ""}
                  onChange={(e) => memberToEdit && setMemberToEdit({...memberToEdit, email: e.target.value})}
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

      {/* Delete Member Dialog */}
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
