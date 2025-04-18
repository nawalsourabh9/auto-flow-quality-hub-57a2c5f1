
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOTP } from "@/hooks/use-otp";
import { OTPInput } from "./OTPInput";
import { VerificationActions } from "./VerificationActions";

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

      try {
        const { error: emailError } = await supabase.functions.invoke('send-email', {
          body: {
            to: email,
            subject: "Verify your email",
            body: `Your verification code is: ${newOtp}. This code will expire in 10 minutes.`,
            isHtml: false
          }
        });

        if (emailError) throw emailError;
        toast.success("New verification code sent to your email");
      } catch (emailError) {
        console.error("Email error during resend:", emailError);
        toast.warning(
          "Could not send email, but you can use the OTP code from console logs: " + newOtp
        );
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
