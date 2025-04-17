
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const { signIn, loading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  if (user) {
    const from = (location.state as any)?.from?.pathname || "/";
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // First check if the user exists without actually logging in
      const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email);
      
      if (userError) {
        setDebugInfo(`User check error: ${userError.message}`);
        // Continue with normal sign in to show standard errors
      } else if (!userData?.user) {
        setDebugInfo(`User with email ${email} not found in auth system`);
        // Continue with normal sign in to show standard errors
      } else {
        setDebugInfo(`User found with ID: ${userData.user.id}. Attempting login...`);
      }
    } catch (checkError) {
      console.error("Error checking user:", checkError);
      // Continue with normal sign in
    }

    try {
      await signIn(email, password);
    } catch (error: any) {
      setDebugInfo(`Sign in error: ${error.message}`);
    }
  };

  // Debug function to check approval status
  const checkApprovalStatus = async () => {
    if (!email) {
      toast.error("Please enter an email first");
      return;
    }
    
    try {
      setDebugInfo("Checking approval status...");
      const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email);
      
      if (userError) {
        setDebugInfo(`User check error: ${userError.message}`);
        return;
      }
      
      if (!userData?.user) {
        setDebugInfo(`User with email ${email} not found`);
        return;
      }
      
      const { data: approvalData, error: approvalError } = await supabase
        .from('account_approvals')
        .select('status')
        .eq('user_id', userData.user.id)
        .single();
      
      if (approvalError) {
        if (approvalError.code === 'PGRST116') {
          setDebugInfo(`No approval record found for ${email}`);
        } else {
          setDebugInfo(`Approval check error: ${approvalError.message}`);
        }
        return;
      }
      
      setDebugInfo(`Approval status for ${email}: ${approvalData.status}`);
    } catch (error: any) {
      setDebugInfo(`Error: ${error.message}`);
    }
  };

  // Debug function to create admin
  const recreateAdmin = async () => {
    try {
      setDebugInfo("Attempting to recreate admin...");
      const { data, error } = await supabase.functions.invoke('create-admin');
      
      if (error) {
        setDebugInfo(`Admin creation error: ${error.message}`);
        return;
      }
      
      setDebugInfo(`Admin creation result: ${JSON.stringify(data)}`);
      toast.success("Admin user recreation attempted. Check debug info for results.");
    } catch (error: any) {
      setDebugInfo(`Error: ${error.message}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/reset-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {debugInfo && (
              <div className="p-3 text-xs bg-gray-100 rounded overflow-auto max-h-32">
                <p className="font-semibold">Debug Info:</p>
                <pre className="whitespace-pre-wrap">{debugInfo}</pre>
              </div>
            )}
            
            {/* Debug buttons - only visible in development */}
            {import.meta.env.DEV && (
              <div className="flex gap-2 mt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                  onClick={checkApprovalStatus}
                >
                  Check Approval
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={recreateAdmin}
                >
                  Recreate Admin
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                "Sign in"
              )}
            </Button>
            <p className="text-center text-sm text-gray-500 mt-2">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-medium text-primary hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
