
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Loader2 } from "lucide-react";
import { OTPInput } from "./OTPInput";
import { VerificationActions } from "./VerificationActions";

interface EmailVerificationSectionProps {
  email: string;
  otpSending: boolean;
  showOtpInput: boolean;
  countdown: number;
  otpValue: string;
  latestOtp: string | null;
  verified: boolean;
  loading: boolean;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerateOTP: () => void;
  onOtpChange: (value: string) => void;
  onAutoFill: () => void;
  onVerify: () => void;
  onResend: () => void;
}

export const EmailVerificationSection = ({
  email,
  otpSending,
  showOtpInput,
  countdown,
  otpValue,
  latestOtp,
  verified,
  loading,
  onEmailChange,
  onGenerateOTP,
  onOtpChange,
  onAutoFill,
  onVerify,
  onResend,
}: EmailVerificationSectionProps) => {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={onEmailChange}
          required
        />
        {!showOtpInput ? (
          <Button 
            type="button"
            variant="outline"
            className="whitespace-nowrap px-4"
            disabled={otpSending || !email}
            onClick={onGenerateOTP}
          >
            {otpSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Get OTP
              </>
            )}
          </Button>
        ) : (
          <Button 
            type="button"
            variant="outline"
            className="whitespace-nowrap px-4"
            onClick={onResend}
            disabled={countdown > 0 || otpSending}
          >
            {otpSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending
              </>
            ) : countdown > 0 ? (
              `Resend in ${countdown}s`
            ) : (
              'Resend OTP'
            )}
          </Button>
        )}
      </div>

      {showOtpInput && (
        <div className="flex items-center space-x-2">
          <div className="flex-grow">
            <OTPInput
              value={otpValue}
              onChange={onOtpChange}
              latestOtp={latestOtp}
              onAutoFill={onAutoFill}
              email={email}
              disabled={verified}
            />
          </div>
          
          <div className="w-auto">
            <VerificationActions
              verified={verified}
              loading={loading}
              resendLoading={otpSending}
              onVerify={onVerify}
              onResend={onResend}
              otpLength={otpValue.length}
            />
          </div>
        </div>
      )}
    </div>
  );
};

