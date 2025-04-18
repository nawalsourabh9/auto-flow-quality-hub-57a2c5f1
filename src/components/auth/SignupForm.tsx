
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateOTP } from "@/utils/auth-utils";

interface SignupFormProps {
  onVerificationStart: () => void;
  email: string;
  setEmail: (email: string) => void;
  firstName: string;
  setFirstName: (name: string) => void;
  lastName: string;
  setLastName: (name: string) => void;
  password: string;
  setPassword: (password: string) => void;
}

export const SignupForm = ({
  onVerificationStart,
  email,
  setEmail,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  password,
  setPassword,
}: SignupFormProps) => {
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [otpSending, setOtpSending] = useState(false);

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

  const generateOTPCode = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setOtpSending(true);
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("Generated OTP:", otp); // Debug log
      
      // First, store the OTP in the database
      const { error: otpError } = await supabase.from('otp_codes').insert({
        email,
        code: otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        verified: false
      });

      if (otpError) {
        console.error("OTP database error:", otpError);
        throw otpError;
      }

      // Now try to send the email
      try {
        // Use the sendEmail service function
        const { error: emailError } = await supabase.functions.invoke('send-email', {
          body: {
            to: email,
            subject: "Verify your email",
            body: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
            isHtml: false
          }
        });

        if (emailError) {
          console.error("Email error:", emailError);
          throw emailError;
        }

        // If everything went well, start verification
        toast.success("Verification code sent to your email");
        onVerificationStart();
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        
        // Even if email sending fails, proceed with verification
        // This allows testing the flow even if email service is unavailable
        toast.warning(
          "Could not send email, but verification can proceed. Use the OTP code from the console logs: " + otp
        );
        onVerificationStart();
      }
    } catch (error) {
      console.error("Error during OTP generation:", error);
      toast.error("Failed to generate verification code");
    } finally {
      setOtpSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;
  };

  return (
    <>
      <Alert className="bg-blue-50 border-blue-200 mb-4">
        <InfoIcon className="h-4 w-4 text-blue-700" />
        <AlertDescription className="text-blue-700">
          New accounts require administrator approval before they can be used. 
          You'll receive an email notification when your account is approved.
        </AlertDescription>
      </Alert>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
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
        </div>
        <div className="mt-6 space-y-4">
          <Button 
            type="button" 
            className="w-full"
            onClick={generateOTPCode}
            disabled={otpSending || !email || firstName === "" || lastName === "" || password === "" || confirmPassword === ""}
          >
            {otpSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending code...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Generate Verification Code
              </>
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
        </div>
      </form>
    </>
  );
};
