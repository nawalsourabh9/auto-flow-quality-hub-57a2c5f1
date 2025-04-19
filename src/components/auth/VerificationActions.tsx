
import { Button } from "@/components/ui/button";
import { CircleCheck, Loader2 } from "lucide-react";

interface VerificationActionsProps {
  verified: boolean;
  loading: boolean;
  resendLoading: boolean;
  onVerify: () => void;
  onResend: () => void;
  otpLength: number;
}

export const VerificationActions = ({
  verified,
  loading,
  resendLoading,
  onVerify,
  onResend,
  otpLength
}: VerificationActionsProps) => {
  return (
    <>
      {verified ? (
        <Button
          className="w-full bg-green-600 hover:bg-green-700 flex-grow"
          size="sm"
          disabled
          style={{marginTop: '30px'}}
        >
          <CircleCheck className="mr-2 h-4 w-4" />
          Verified
        </Button>
      ) : (
        <Button
          className="w-auto px-3 flex-grow"   // Made the button narrower
          size="sm"
          onClick={onVerify}
          style={{marginTop: '30px'}}
          disabled={otpLength !== 6 || loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying
            </>
          ) : (
            "Verify"  // Shortened text
          )}
        </Button>
      )}
    </>
  );
};
