
import { useState } from 'react';
import { EmailNotification } from '@/components/EmailNotification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmailTest() {
  const [recipient, setRecipient] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  return (
    <div className="container mx-auto py-8">
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
                />
              </div>
              
              <Button 
                onClick={() => setShowEmailForm(true)} 
                disabled={!recipient}
                className="w-full"
              >
                Create Test Email
              </Button>
            </div>
          ) : (
            <EmailNotification 
              defaultTo={recipient}
              defaultSubject="Test Email from E-QMS" 
              defaultBody="This is a test email to verify that the email configuration is working correctly."
              onSuccess={() => setShowEmailForm(false)}
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
