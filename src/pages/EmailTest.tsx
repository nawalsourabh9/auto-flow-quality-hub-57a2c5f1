
import { useState } from 'react';
import { EmailNotification } from '@/components/EmailNotification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';

export default function EmailTest() {
  const [recipient, setRecipient] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  const handleTestEmail = () => {
    if (!recipient) {
      toast.error("Please enter a recipient email address");
      return;
    }
    
    if (!recipient.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setShowEmailForm(true);
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-lg mx-auto mb-6">
        <Link to="/" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>
      
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Email Test</CardTitle>
          <CardDescription>
            Send a test email to verify your email configuration is working correctly
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!showEmailForm ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="recipient" className="text-sm font-medium">
                  Recipient Email Address
                </label>
                <Input 
                  id="recipient"
                  type="email"
                  value={recipient} 
                  onChange={(e) => setRecipient(e.target.value)} 
                  placeholder="Enter email address"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && recipient) {
                      handleTestEmail();
                    }
                  }}
                />
              </div>
              
              <Button 
                onClick={handleTestEmail} 
                disabled={!recipient}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Create Test Email
              </Button>
            </div>
          ) : (
            <EmailNotification 
              defaultTo={recipient}
              defaultSubject="Test Email from E-QMS" 
              defaultBody="This is a test email to verify that the email configuration is working correctly."
              onSuccess={() => {
                setShowEmailForm(false);
                setRecipient('');
              }}
            />
          )}
        </CardContent>
        
        {showEmailForm && (
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEmailForm(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
