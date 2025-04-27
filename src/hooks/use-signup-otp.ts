
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendOTPEmail } from "@/services/emailService";

export const useSignupOTP = (email: string) => {
  const [otpSending, setOtpSending] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [latestOtp, setLatestOtp] = useState<string | null>(null);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

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

      toast.success("Verification code sent to your email");
      setLatestOtp(otp);
      setShowOtpInput(true);
      setCountdown(30);
      
      try {
        await sendOTPEmail(email, otp);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
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
