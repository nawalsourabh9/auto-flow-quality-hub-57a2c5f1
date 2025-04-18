
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
  onVerify,
  otpLength
}: VerificationActionsProps) => {
  return (
    <>
      {verified ? (
        <Button
          className="w-full bg-green-600 hover:bg-green-700"
          size="sm"
          disabled
        >
          <CircleCheck className="mr-2 h-4 w-4" />
          Email Verified
        </Button>
      ) : (
        <Button
          className="w-full"
          size="sm"
          onClick={onVerify}
          disabled={otpLength !== 6 || loading}
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
    </>
  );
};
