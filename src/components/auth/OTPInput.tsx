
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  latestOtp: string | null;
  onAutoFill: () => void;
  email: string;
  disabled?: boolean;
}

export const OTPInput = ({ 
  value, 
  onChange, 
  latestOtp, 
  onAutoFill, 
  email, 
  disabled 
}: OTPInputProps) => {
  return (
    <div className="space-y-2">
      <Label>Enter verification code sent to your email</Label>
      <InputOTP 
        value={value} 
        onChange={onChange}
        maxLength={6}
        disabled={disabled}
        render={({ slots }) => (
          <InputOTPGroup className="gap-2 mx-auto w-fit">
            {slots.map((slot, i) => (
              <InputOTPSlot 
                key={i} 
                {...slot} 
                className="h-12 w-12 rounded-md border border-input bg-background text-xl font-bold"
              />
            ))}
          </InputOTPGroup>
        )}
      />
      <p className="text-sm text-gray-500 mt-2">
        A 6-digit code has been sent to {email}
      </p>
      {latestOtp && (
        <p className="text-xs text-blue-500 mt-1 cursor-pointer" onClick={onAutoFill}>
          (Testing: Click to auto-fill latest OTP)
        </p>
      )}
    </div>
  );
};
