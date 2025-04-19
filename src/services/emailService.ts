
import { Resend } from 'resend';
import { getOTPEmailTemplate } from './emailTemplates';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

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
