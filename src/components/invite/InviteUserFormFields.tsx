
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { InviteFormData } from "./InviteUserForm";

interface InviteUserFormFieldsProps {
  formData: InviteFormData;
  onChange: (field: keyof InviteFormData, value: string) => void;
}

export function InviteUserFormFields({ formData, onChange }: InviteUserFormFieldsProps) {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  // Fetch departments from the database
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('*');
        
        if (error) throw error;
        console.log("Fetched departments:", data);
        setDepartments(data || []);
      } catch (error) {
        console.error("Error fetching departments:", error);
        toast.error("Failed to load departments");
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, []);

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          placeholder="user@example.com"
          value={formData.email}
          onChange={(e) => onChange("email", e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="firstName">First Name *</Label>
        <Input
          id="firstName"
          type="text"
          placeholder="John"
          value={formData.firstName}
          onChange={(e) => onChange("firstName", e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="lastName">Last Name *</Label>
        <Input
          id="lastName"
          type="text"
          placeholder="Doe"
          value={formData.lastName}
          onChange={(e) => onChange("lastName", e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="position">Position *</Label>
        <Input
          id="position"
          type="text"
          placeholder="Quality Manager"
          value={formData.position}
          onChange={(e) => onChange("position", e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="role">Role *</Label>
        <Select 
          value={formData.role} 
          onValueChange={(value) => onChange("role", value)} 
          required
        >
          <SelectTrigger id="role">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Select 
          value={formData.departmentId} 
          onValueChange={(value) => onChange("departmentId", value)}
        >
          <SelectTrigger id="department" disabled={loadingDepartments}>
            <SelectValue placeholder="Select a department" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loadingDepartments && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            Loading departments...
          </div>
        )}
        {!loadingDepartments && departments.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No departments found
          </div>
        )}
      </div>
    </>
  );
}
