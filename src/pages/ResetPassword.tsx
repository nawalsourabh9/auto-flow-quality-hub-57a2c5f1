
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // This is a mock password reset - in a real app, this would connect to an auth service
      console.log('Requesting password reset for:', email);
      
      // For demo purposes, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSubmitted(true);
      toast.success('Password reset instructions sent');
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Error sending password reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-eqms-blue">BDS Manufacturing</h2>
          <p className="text-sm text-muted-foreground">IATF Compliant Quality Management System</p>
        </div>
        
        {!isSubmitted ? (
          <>
            <div className="text-center mb-6">
              <h1 className="text-xl font-semibold">Reset your password</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Enter your email address and we'll send you instructions to reset your password
              </p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com" 
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send reset instructions"}
              </Button>
              
              <div className="text-center">
                <Link to="/login" className="text-sm text-primary hover:underline">
                  Back to login
                </Link>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4">
            <h1 className="text-xl font-semibold">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              We've sent password reset instructions to <span className="font-medium">{email}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Didn't receive an email? Check your spam folder or 
              <button 
                className="text-primary hover:underline mx-1"
                onClick={() => setIsSubmitted(false)}
              >
                try again
              </button>
            </p>
            <Button asChild className="mt-4" variant="outline">
              <Link to="/login">Back to login</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
