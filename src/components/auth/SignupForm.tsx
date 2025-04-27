
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { NameFields } from "./NameFields";
import { EmailVerificationSection } from "./EmailVerificationSection";
import { PasswordSection } from "./PasswordSection";
import { useSignupOTP } from "@/hooks/use-signup-otp";
import { usePasswordValidation } from "@/hooks/use-password-validation";

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
  submitting: boolean;
  error?: string | null;
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
  submitting,
  error,
}: SignupFormProps) => {
  const {
    otpSending,
    otpValue,
    setOtpValue,
    latestOtp,
    showOtpInput,
    countdown,
    verified,
    loading,
    emailVerified,
    generateOTPCode,
    verifyOTP,
    autoFillOtp
  } = useSignupOTP(email);

  const {
    confirmPassword,
    setConfirmPassword,
    passwordError,
    setPasswordError,
    validatePassword
  } = usePasswordValidation();

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailVerified) {
      toast.error("Please verify your email first");
      return;
    }
    
    if (!validatePassword(password, confirmPassword)) {
      return;
    }

    try {
      console.log("Form submission starting with data:", { email, firstName, lastName });
      await onVerificationStart();
    } catch (error) {
      console.error("Error in form submission:", error);
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
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
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
            disabled={!emailVerified || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              emailVerified ? "Create Account" : "Verify Email to Continue"
            )}
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
