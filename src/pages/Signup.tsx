
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { OTPVerification } from "@/components/auth/OTPVerification";
import { SignupForm } from "@/components/auth/SignupForm";
import { SignupComplete } from "@/components/auth/SignupComplete";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const { signUp } = useAuth();

  // For debugging - will log state changes
  useEffect(() => {
    console.log("Signup state:", {
      showOTPVerification,
      signupComplete,
      email,
      firstName,
      lastName
    });
  }, [showOTPVerification, signupComplete, email, firstName, lastName]);

  const handleVerificationStart = () => {
    console.log("Starting OTP verification for email:", email);
    setShowOTPVerification(true);
  };

  const handleVerificationComplete = async () => {
    console.log("OTP verification completed. Creating account for:", email);
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
            {signupComplete ? "Registration Complete" : (showOTPVerification ? "Verify Your Email" : "Create an account")}
          </CardTitle>
          <CardDescription>
            {signupComplete 
              ? "Your account is pending approval" 
              : showOTPVerification 
                ? "Enter the verification code sent to your email"
                : "Enter your details to create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signupComplete ? (
            <SignupComplete />
          ) : showOTPVerification ? (
            <OTPVerification
              email={email}
              onVerificationComplete={handleVerificationComplete}
            />
          ) : (
            <SignupForm
              onVerificationStart={handleVerificationStart}
              email={email}
              setEmail={setEmail}
              firstName={firstName}
              setFirstName={setFirstName}
              lastName={lastName}
              setLastName={setLastName}
              password={password}
              setPassword={setPassword}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
