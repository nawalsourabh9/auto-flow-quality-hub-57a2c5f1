
import { useState } from "react";
import { 
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OTPVerificationProps {
  email: string;
  onVerificationComplete: () => void;
}

export const OTPVerification = ({ email, onVerificationComplete }: OTPVerificationProps) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyOTP = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('email', email)
        .eq('code', otp)
        .gt('expires_at', new Date().toISOString())
        .eq('verified', false)
        .single();

      if (error || !data) {
        toast.error("Invalid or expired OTP code");
        return;
      }

      // Mark OTP as verified
      await supabase
        .from('otp_codes')
        .update({ verified: true })
        .eq('id', data.id);

      toast.success("Email verified successfully");
      onVerificationComplete();
    } catch (error) {
      toast.error("Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Enter verification code sent to your email</Label>
        <InputOTP 
          value={otp} 
          onChange={(value) => setOtp(value)}
          maxLength={6}
          render={({ slots }) => (
            <InputOTPGroup>
              {slots.map((slot, i) => (
                <InputOTPSlot key={i} index={i} {...slot} />
              ))}
            </InputOTPGroup>
          )}
        />
      </div>
      <Button
        className="w-full"
        onClick={verifyOTP}
        disabled={otp.length !== 6 || loading}
      >
        Verify Code
      </Button>
    </div>
  );
};
