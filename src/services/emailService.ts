
import { supabase } from '@/integrations/supabase/client';
import { getOTPEmailTemplate } from './emailTemplates';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  body: string;
  isHtml?: boolean;
}

export const sendEmail = async ({
  to,
  subject,
  body,
  isHtml = false
}: SendEmailParams) => {
  try {
    console.log("Sending email to:", to);
    
    // If we're in development, simulate sending
    if (import.meta.env.DEV) {
      console.warn("⚠️ Development mode - emails won't actually be sent");
      console.log("Email content:", { to, subject, body: body.substring(0, 100) + '...' });
      
      // Return a mock successful response
      return {
        id: 'mock_email_id',
        from: 'noreply@bdsmanufacturing.in',
        to: Array.isArray(to) ? to : [to],
        created_at: new Date().toISOString()
      };
    }
    
    // Send email using edge function
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject,
        body,
        isHtml
      }
    });

    if (error) throw error;
    
    console.log("Email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Email service error:", error);
    throw error;
  }
};

export const sendOTPEmail = async (to: string, otp: string) => {
  try {
    console.log(`Sending OTP email to ${to} with code ${otp}`);
    
    // If we're in development, use the local template
    if (import.meta.env.DEV) {
      const htmlContent = getOTPEmailTemplate({ 
        otp, 
        expiryMinutes: 10 
      });
      
      return sendEmail({
        to,
        subject: "Your Verification Code",
        body: htmlContent,
        isHtml: true
      });
    }
    
    // Send OTP email using edge function
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        otp,
        type: 'otp'
      }
    });

    if (error) throw error;
    
    console.log("OTP email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("OTP email service error:", error);
    throw error;
  }
};
