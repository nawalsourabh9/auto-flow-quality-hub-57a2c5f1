
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const SignupComplete = () => {
  const navigate = useNavigate();

  return (
    <>
      <Alert className="bg-blue-50 border-blue-200">
        <InfoIcon className="h-4 w-4 text-blue-700" />
        <AlertDescription className="text-blue-700">
          Thank you for registering. Your account is now pending admin approval. 
          You'll receive an email when your account is approved and ready to use.
        </AlertDescription>
      </Alert>
      <div className="pt-4">
        <Button 
          className="w-full" 
          variant="outline" 
          onClick={() => navigate('/login')}
        >
          Return to Login
        </Button>
      </div>
    </>
  );
};
