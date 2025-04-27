
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOTP } from "@/hooks/use-otp";
import { OTPInput } from "./OTPInput";
import { VerificationActions } from "./VerificationActions";
import { sendOTPEmail } from "@/services/emailService";

interface OTPVerificationProps {
  email: string;
  onVerificationComplete: () => void;
}

export const OTPVerification = ({ email, onVerificationComplete }: OTPVerificationProps) => {
  const [resendLoading, setResendLoading] = useState(false);
  const {
    otp,
    setOtp,
    loading,
    verified,
    latestOtp,
    verifyOTP,
    autoFillOtp
  } = useOTP(email);

  const handleVerify = async () => {
    const success = await verifyOTP();
    if (success) {
      setTimeout(() => {
        onVerificationComplete();
      }, 1500);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("Resent OTP:", newOtp);
      
      const { error: otpError } = await supabase.from('otp_codes').insert({
        email,
        code: newOtp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        verified: false
      });

      if (otpError) throw otpError;

      // Always display the code for testing purposes
      toast.success("New verification code sent. For testing use: " + newOtp);
      
      // Attempt to send email but don't block on failure
      try {
        await sendOTPEmail(email, newOtp);
      } catch (emailError) {
        console.error("Email error during resend:", emailError);
      }
    } catch (error) {
      console.error("Error resending code:", error);
      toast.error("Failed to resend verification code");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <OTPInput
        value={otp}
        onChange={setOtp}
        latestOtp={latestOtp}
        onAutoFill={autoFillOtp}
        email={email}
        disabled={verified}
      />
      
      <VerificationActions
        verified={verified}
        loading={loading}
        resendLoading={resendLoading}
        onVerify={handleVerify}
        onResend={handleResendCode}
        otpLength={otp.length}
      />
    </div>
  );
};
