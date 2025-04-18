import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { OTPVerification } from "@/components/auth/OTPVerification";
import { supabase } from "@/integrations/supabase/client";

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const { signUp, loading } = useAuth();
  const navigate = useNavigate();

  const validatePassword = () => {
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;

    try {
      const otp = generateOTP();
      const { error: otpError } = await supabase.from('otp_codes').insert({
        email,
        code: otp
      });

      if (otpError) throw otpError;

      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: "Verify your email",
          body: `Your verification code is: ${otp}`,
          isHtml: false
        }
      });

      if (emailError) throw emailError;

      setShowOTPVerification(true);
      toast.success("Verification code sent to your email");
    } catch (error) {
      console.error("Error during signup:", error);
      toast.error("Failed to send verification code");
    }
  };

  const handleVerificationComplete = async () => {
    try {
      await signUp(email, password, {
        first_name: firstName,
        last_name: lastName
      });
      
      setSignupComplete(true);
      toast.success("Account created successfully! Waiting for admin approval.");
    } catch (error) {
      console.error("Error completing signup:", error);
      toast.error("Failed to complete signup");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {signupComplete ? "Registration Complete" : "Create an account"}
          </CardTitle>
          <CardDescription>
            {signupComplete 
              ? "Your account is pending approval" 
              : showOTPVerification 
                ? "Verify your email"
                : "Enter your details to create your account"}
          </CardDescription>
        </CardHeader>
        
        {signupComplete ? (
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <InfoIcon className="h-4 w-4 text-blue-700" />
              <AlertDescription className="text-blue-700">
                Thank you for registering. Your account is now pending admin approval. 
                You'll receive an email when your account is approved and ready to use.
              </AlertDescription>
            </Alert>
            <div className="pt-4">
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={() => navigate('/login')}
              >
                Return to Login
              </Button>
            </div>
          </CardContent>
        ) : showOTPVerification ? (
          <CardContent>
            <OTPVerification
              email={email}
              onVerificationComplete={handleVerificationComplete}
            />
          </CardContent>
        ) : (
          <form onSubmit={handleInitialSubmit}>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <InfoIcon className="h-4 w-4 text-blue-700" />
                <AlertDescription className="text-blue-700">
                  New accounts require administrator approval before they can be used. 
                  You'll receive an email notification when your account is approved.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {passwordError && (
                  <p className="text-sm text-red-500">{passwordError}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
              <p className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default Signup;
