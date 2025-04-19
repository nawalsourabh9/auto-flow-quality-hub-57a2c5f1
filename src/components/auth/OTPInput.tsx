
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
    <div className="space-y-2" style={{flexBasis: '68%'}}>
      <Label>Enter verification code sent to your email</Label>
      <InputOTP 
        value={value} 
        onChange={onChange}
        maxLength={6}
        disabled={disabled}
        render={({ slots }) => (
          <InputOTPGroup className="gap-1 w-fit">
            {slots.map((slot, i) => (
              <InputOTPSlot 
                key={i} 
                {...slot} 
                className="h-9 w-9 rounded-md border border-input bg-background text-sm font-medium"
              />
            ))}
          </InputOTPGroup>
        )}
      />
      <p className="text-sm text-gray-500 mt-2">
        A 6-digit code has been sent to {email}
      </p>
    </div>
  );
};

