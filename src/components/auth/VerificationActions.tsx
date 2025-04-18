
import { Button } from "@/components/ui/button";
import { CircleCheck, Loader2, RefreshCw } from "lucide-react";

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
          className="w-full bg-green-600 hover:bg-green-700"
          disabled
        >
          <CircleCheck className="mr-2 h-4 w-4" />
          Email Verified
        </Button>
      ) : (
        <Button
          className="w-full"
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
      
      {!verified && (
        <div className="text-center">
          <Button 
            variant="link" 
            onClick={onResend}
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
    </>
  );
};
