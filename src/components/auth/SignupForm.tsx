import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

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
  const [otpValue, setOtpValue] = useState("");
  const [latestOtp, setLatestOtp] = useState<string | null>(null);
  const [showOtpInput, setShowOtpInput] = useState(false);

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
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("Generated OTP for testing:", otp);
      
      const { error: otpError } = await supabase.from('otp_codes').insert({
        email,
        code: otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        verified: false
      });

      if (otpError) throw otpError;

      try {
        const { error: emailError } = await supabase.functions.invoke('send-email', {
          body: {
            to: email,
            subject: "Your OTP Code",
            body: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
            isHtml: false
          }
        });

        if (emailError) throw emailError;
        toast.success("Verification code sent to your email");
        setLatestOtp(otp);
        setShowOtpInput(true);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        toast.warning(
          "Could not send email, but you can use this test code: " + otp
        );
        setLatestOtp(otp);
        setShowOtpInput(true);
      }
    } catch (error) {
      console.error("Error during OTP generation:", error);
      toast.error("Failed to generate verification code");
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOTP = async () => {
    if (otpValue.length !== 6) {
      toast.error("Please enter a complete 6-digit code");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('email', email)
        .eq('code', otpValue)
        .gt('expires_at', new Date().toISOString())
        .eq('verified', false)
        .single();

      if (error || !data) {
        toast.error("Invalid or expired verification code");
        return;
      }

      const { error: updateError } = await supabase
        .from('otp_codes')
        .update({ verified: true })
        .eq('id', data.id);

      if (updateError) throw updateError;

      toast.success("Email verified successfully");
      onVerificationStart();
    } catch (error) {
      console.error("OTP verification failed:", error);
      toast.error("Failed to verify code");
    }
  };

  const autoFillOtp = () => {
    if (latestOtp) {
      setOtpValue(latestOtp);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName || !lastName || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!validatePassword()) {
      return;
    }

    generateOTPCode();
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
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button 
                type="button"
                variant="outline"
                className="w-auto"
                onClick={generateOTPCode}
                disabled={otpSending || !email}
              >
                {otpSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Get OTP
                  </>
                )}
              </Button>
            </div>
          </div>

          {showOtpInput && (
            <div className="space-y-2">
              <Label>Enter verification code</Label>
              <InputOTP
                value={otpValue}
                onChange={setOtpValue}
                maxLength={6}
                render={({ slots }) => (
                  <InputOTPGroup className="gap-2">
                    {slots.map((slot, i) => (
                      <InputOTPSlot key={i} {...slot} />
                    ))}
                  </InputOTPGroup>
                )}
              />
              {latestOtp && (
                <p className="text-xs text-blue-500 mt-1 cursor-pointer" onClick={autoFillOtp}>
                  (Testing: Click to auto-fill latest OTP)
                </p>
              )}
            </div>
          )}

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

          <Button 
            type="submit"
            className="w-full"
            disabled={otpSending || !email || !firstName || !lastName || !password || !confirmPassword}
          >
            <Send className="mr-2 h-4 w-4" />
            Submit
          </Button>
        </div>
        
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </>
  );
};
