
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";

const InviteUser = () => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch departments on component mount
  useState(() => {
    const fetchDepartments = async () => {
      try {
        const { data, error } = await supabase.from("departments").select("*");
        if (error) throw error;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await supabase.functions.invoke("send-invitation", {
        body: {
          email,
          role,
          departmentId: departmentId || undefined,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to send invitation");
      }

      toast.success(`Invitation sent to ${email}`);
      setEmail("");
      setRole("user");
      setDepartmentId("");
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-2xl font-bold">Invite User</CardTitle>
              <CardDescription>
                Send an invitation email to a new user
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
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
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger disabled={loadingDepartments}>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Invitation...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default InviteUser;
