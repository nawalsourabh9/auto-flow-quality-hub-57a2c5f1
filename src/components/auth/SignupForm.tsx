import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { NameFields } from "./NameFields";
import { EmailVerificationSection } from "./EmailVerificationSection";
import { PasswordSection } from "./PasswordSection";
import { sendEmail } from "@/services/emailService";

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
  const [countdown, setCountdown] = useState(0);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

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
        await sendEmail({
          to: email,
          subject: "Your OTP Code",
          body: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
          isHtml: false
        });
        
        toast.success("Verification code sent to your email");
        setLatestOtp(otp);
        setShowOtpInput(true);
        setCountdown(30); // Start 30 second countdown
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        toast.warning(
          "Could not send email, but you can use this test code: " + otp
        );
        setLatestOtp(otp);
        setShowOtpInput(true);
        setCountdown(30); // Start 30 second countdown even in test mode
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

    setLoading(true);
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

      setVerified(true);
      setEmailVerified(true);
      toast.success("Email verified successfully");
    } catch (error) {
      console.error("OTP verification failed:", error);
      toast.error("Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  const autoFillOtp = () => {
    if (latestOtp) {
      setOtpValue(latestOtp);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailVerified) {
      toast.error("Please verify your email first");
      return;
    }
    
    if (!validatePassword()) {
      return;
    }

    try {
      await onVerificationStart();
    } catch (error) {
      console.error("Error completing signup:", error);
    }
  };

  const handleOTPRequest = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!firstName || !lastName) {
      toast.error("Please fill in your name fields");
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
      
      <form onSubmit={handleSubmitForm}>
        <div className="space-y-4">
          <NameFields
            firstName={firstName}
            lastName={lastName}
            onFirstNameChange={(e) => setFirstName(e.target.value)}
            onLastNameChange={(e) => setLastName(e.target.value)}
          />

          <EmailVerificationSection
            email={email}
            otpSending={otpSending}
            showOtpInput={showOtpInput}
            countdown={countdown}
            otpValue={otpValue}
            latestOtp={latestOtp}
            verified={verified}
            loading={loading}
            onEmailChange={(e) => setEmail(e.target.value)}
            onGenerateOTP={handleOTPRequest}
            onOtpChange={setOtpValue}
            onAutoFill={autoFillOtp}
            onVerify={verifyOTP}
            onResend={generateOTPCode}
          />

          <PasswordSection
            password={password}
            confirmPassword={confirmPassword}
            passwordError={passwordError}
            onPasswordChange={(e) => setPassword(e.target.value)}
            onConfirmPasswordChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!emailVerified}
          >
            {emailVerified ? "Create Account" : "Verify Email to Continue"}
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
