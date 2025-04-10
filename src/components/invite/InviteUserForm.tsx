
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { InviteUserFormFields } from "./InviteUserFormFields";

export interface InviteFormData {
  email: string;
  firstName: string;
  lastName: string;
  position: string;
  role: string;
  departmentId: string;
}

export function InviteUserForm() {
  const [formData, setFormData] = useState<InviteFormData>({
    email: "",
    firstName: "",
    lastName: "",
    position: "",
    role: "user",
    departmentId: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (field: keyof InviteFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await supabase.functions.invoke("send-invitation", {
        body: {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          position: formData.position,
          role: formData.role,
          departmentId: formData.departmentId || undefined,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to send invitation");
      }

      toast.success(`Invitation sent to ${formData.email}`);
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        position: "",
        role: "user",
        departmentId: "",
      });
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
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
          <InviteUserFormFields 
            formData={formData}
            onChange={handleChange}
          />
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
  );
}
