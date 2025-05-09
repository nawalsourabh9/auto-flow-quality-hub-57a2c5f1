
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendOTPEmail } from "@/services/emailService";
import { useCountdown } from "./use-countdown";

export const useSignupOTP = (email: string) => {
  const [otpSending, setOtpSending] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [latestOtp, setLatestOtp] = useState<string | null>(null);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [countdown, setCountdown] = useCountdown(0);

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

      // Show the OTP in a toast for testing purposes
      toast.success("Verification code: " + otp);
      setLatestOtp(otp);
      setShowOtpInput(true);
      setCountdown(30);
      
      // Try to send email, but don't fail the process if it doesn't work
      try {
        await sendOTPEmail(email, otp);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        toast.warning("Could not send email, but you can use the code shown in the notification above.");
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
      return false;
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
        return false;
      }

      const { error: updateError } = await supabase
        .from('otp_codes')
        .update({ verified: true })
        .eq('id', data.id);

      if (updateError) throw updateError;

      setVerified(true);
      setEmailVerified(true);
      toast.success("Email verified successfully");
      return true;
    } catch (error) {
      console.error("OTP verification failed:", error);
      toast.error("Failed to verify code");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const autoFillOtp = () => {
    if (latestOtp) {
      setOtpValue(latestOtp);
    }
  };

  return {
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
  };
};
