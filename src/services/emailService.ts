
import { Resend } from 'resend';
import { getOTPEmailTemplate } from './emailTemplates';

// Create Resend instance with fallback for missing API key
const API_KEY = import.meta.env.VITE_RESEND_API_KEY || 'dummy_key_for_dev';
const resend = new Resend(API_KEY);

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
    
    // Check if we're using a dummy key and simulate success
    if (API_KEY === 'dummy_key_for_dev') {
      console.warn("⚠️ Using dummy API key for Resend - emails won't actually be sent");
      console.log("Email content:", { to, subject, body: body.substring(0, 100) + '...' });
      
      // Return a mock successful response
      return {
        id: 'mock_email_id',
        from: 'Lovable <onboarding@resend.dev>',
        to: Array.isArray(to) ? to : [to],
        created_at: new Date().toISOString()
      };
    }
    
    // Proceed with actual email sending if API key exists
    const emailResponse = await resend.emails.send({
      from: "Lovable <onboarding@resend.dev>",
      to: Array.isArray(to) ? to : [to],
      subject,
      html: isHtml ? body : `<p>${body}</p>`,
    });

    console.log("Email sent successfully:", emailResponse);
    return emailResponse;
  } catch (error) {
    console.error("Email service error:", error);
    throw error;
  }
};

export const sendOTPEmail = async (to: string, otp: string) => {
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
};
