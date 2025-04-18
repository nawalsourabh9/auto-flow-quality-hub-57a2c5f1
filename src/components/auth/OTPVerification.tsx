import { useState, useEffect } from "react";
import { 
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, RefreshCw, CircleCheck } from "lucide-react";

interface OTPVerificationProps {
  email: string;
  onVerificationComplete: () => void;
}

export const OTPVerification = ({ email, onVerificationComplete }: OTPVerificationProps) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [latestOtp, setLatestOtp] = useState<string | null>(null);

  useEffect(() => {
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
    
    fetchLatestOtp();
  }, [email]);

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

      setVerified(true);
      toast.success("Email verified successfully");
      
      // Wait a moment to show the verified state before proceeding
      setTimeout(() => {
        onVerificationComplete();
      }, 1500);
      
    } catch (error) {
      console.error("Failed to verify OTP:", error);
      toast.error("Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("Resent OTP:", newOtp); // Debug log
      
      const { error: otpError } = await supabase.from('otp_codes').insert({
        email,
        code: newOtp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        verified: false
      });

      if (otpError) throw otpError;

      setLatestOtp(newOtp);

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

  const autoFillOtp = () => {
    if (latestOtp) {
      setOtp(latestOtp);
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
          disabled={verified}
          render={({ slots }) => (
            <InputOTPGroup className="gap-2">
              {slots.map((slot, i) => (
                <InputOTPSlot key={i} {...slot} index={i} />
              ))}
            </InputOTPGroup>
          )}
        />
        <p className="text-sm text-gray-500 mt-2">
          A 6-digit code has been sent to {email}
        </p>
        {latestOtp && (
          <p className="text-xs text-blue-500 mt-1 cursor-pointer" onClick={autoFillOtp}>
            (Testing: Click to auto-fill latest OTP)
          </p>
        )}
      </div>
      
      {verified ? (
        <Button
          className="w-full bg-green-600 hover:bg-green-700"
          disabled
        >
          <CircleCheck className="mr-2 h-4 w-4" />
          Email Verified
        </Button>
      ) : (
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
      )}
      
      {!verified && (
        <div className="text-center">
          <Button 
            variant="link" 
            onClick={handleResendCode}
            disabled={resendLoading || verified}
            className="text-sm flex items-center justify-center mx-auto"
          >
            {resendLoading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-3 w-3" />
                Resend verification code
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
