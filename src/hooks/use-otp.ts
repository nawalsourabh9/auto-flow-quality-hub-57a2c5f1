
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useOTP = (email: string) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [latestOtp, setLatestOtp] = useState<string | null>(null);

  useEffect(() => {
    fetchLatestOtp();
  }, [email]);

  const fetchLatestOtp = async () => {
    try {
      const { data, error } = await supabase
        .from('otp_codes')
        .select('code')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (error) {
        console.error("Error fetching latest OTP:", error);
        return;
      }
      
      if (data && data.length > 0) {
        console.log("Latest OTP for testing:", data[0].code);
        setLatestOtp(data[0].code);
      }
    } catch (error) {
      console.error("Failed to fetch latest OTP:", error);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a complete 6-digit code");
      return false;
    }

    setLoading(true);
    try {
      console.log("Verifying OTP:", otp, "for email:", email);
      
      const { data, error } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('email', email)
        .eq('code', otp)
        .gt('expires_at', new Date().toISOString())
        .eq('verified', false)
        .single();

      if (error || !data) {
        console.error("OTP verification error:", error);
        toast.error("Invalid or expired verification code");
        return false;
      }

      const { error: updateError } = await supabase
        .from('otp_codes')
        .update({ verified: true })
        .eq('id', data.id);
        
      if (updateError) {
        console.error("Error updating OTP verification status:", updateError);
        return false;
      }

      setVerified(true);
      toast.success("Email verified successfully");
      return true;
    } catch (error) {
      console.error("Failed to verify OTP:", error);
      toast.error("Failed to verify code");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const autoFillOtp = () => {
    if (latestOtp) {
      setOtp(latestOtp);
    }
  };

  return {
    otp,
    setOtp,
    loading,
    verified,
    latestOtp,
    verifyOTP,
    autoFillOtp
  };
};
