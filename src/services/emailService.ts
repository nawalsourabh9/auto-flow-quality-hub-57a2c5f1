
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
  } catch (error) {
    console.error("OTP email service error:", error);
    throw error;
  }
};
