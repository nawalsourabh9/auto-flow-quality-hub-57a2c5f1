
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
import { Loader2 } from "lucide-react";

interface OTPVerificationProps {
  email: string;
  onVerificationComplete: () => void;
}

export const OTPVerification = ({ email, onVerificationComplete }: OTPVerificationProps) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a complete 6-digit code");
      return;
    }

    setLoading(true);
    try {
      console.log("Verifying OTP:", otp, "for email:", email); // Debug log
      
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
        return;
      }

      // Mark OTP as verified
      const { error: updateError } = await supabase
        .from('otp_codes')
        .update({ verified: true })
        .eq('id', data.id);
        
      if (updateError) {
        console.error("Error updating OTP verification status:", updateError);
      }

      toast.success("Email verified successfully");
      onVerificationComplete();
    } catch (error) {
      console.error("Failed to verify OTP:", error);
      toast.error("Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      const { error: otpError } = await supabase.from('otp_codes').insert({
        email,
        code: newOtp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        verified: false
      });

      if (otpError) throw otpError;

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
    } catch (error) {
      console.error("Error resending code:", error);
      toast.error("Failed to resend verification code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Enter verification code sent to your email</Label>
        <InputOTP 
          value={otp} 
          onChange={(value) => setOtp(value)}
          maxLength={6}
          render={({ slots }) => (
            <InputOTPGroup className="gap-2">
              {slots.map((slot, i) => (
                <InputOTPSlot key={i} index={i} {...slot} />
              ))}
            </InputOTPGroup>
          )}
        />
        <p className="text-sm text-gray-500 mt-2">
          A 6-digit code has been sent to {email}
        </p>
      </div>
      <Button
        className="w-full"
        onClick={verifyOTP}
        disabled={otp.length !== 6 || loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify Code"
        )}
      </Button>
      <div className="text-center">
        <Button 
          variant="link" 
          onClick={handleResendCode}
          disabled={loading}
          className="text-sm"
        >
          Didn't receive a code? Resend
        </Button>
      </div>
    </div>
  );
};
