
import { useState } from 'react';
import { sendEmail } from '@/services/emailService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface EmailNotificationProps {
  defaultTo?: string;
  defaultSubject?: string;
  defaultBody?: string;
  onSuccess?: () => void;
}

export function EmailNotification({
  defaultTo = '',
  defaultSubject = '',
  defaultBody = '',
  onSuccess
}: EmailNotificationProps) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [loading, setLoading] = useState(false);

  const handleSendEmail = async () => {
    if (!to || !subject || !body) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await sendEmail({
        to,
        subject,
        body,
        isHtml: false
      });
      
      toast.success('Email sent successfully');
      setTo('');
      setSubject('');
      setBody('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-md">
      <h3 className="text-lg font-medium">Send Email Notification</h3>
      
      <div className="space-y-2">
        <label htmlFor="to" className="text-sm font-medium">
          To:
        </label>
        <Input 
          id="to"
          value={to} 
          onChange={(e) => setTo(e.target.value)} 
          placeholder="recipient@example.com"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="subject" className="text-sm font-medium">
          Subject:
        </label>
        <Input 
          id="subject"
          value={subject} 
          onChange={(e) => setSubject(e.target.value)} 
          placeholder="Email subject"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="body" className="text-sm font-medium">
          Message:
        </label>
        <Textarea 
          id="body"
          value={body} 
          onChange={(e) => setBody(e.target.value)} 
          placeholder="Email body content"
          rows={4}
        />
      </div>
      
      <Button 
        onClick={handleSendEmail} 
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Sending...' : 'Send Email'}
      </Button>
    </div>
  );
}
