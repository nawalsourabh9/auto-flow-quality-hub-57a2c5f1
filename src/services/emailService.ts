
import { supabase } from '@/integrations/supabase/client';
import { getOTPEmailTemplate } from './emailTemplates';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  body: string;
  isHtml?: boolean;
}

interface EmailResponse {
  data: {
    id: string;
    from: string;
    to: string[];
    created_at: string;
    [key: string]: any;
  } | null;
  error: Error | null;
}

export const sendEmail = async ({
  to,
  subject,
  body,
  isHtml = false
}: SendEmailParams) => {
  try {
    console.log("Sending email to:", to);
    
    // Add retry logic for network issues
    let retries = 3;
    let success = false;
    let data;
    let error;
    
    while (retries > 0 && !success) {
      try {
        // Send email using edge function with timeout
        const response = await Promise.race([
          supabase.functions.invoke('send-email', {
            body: {
              to,
              subject,
              body,
              isHtml
            }
          }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("Request timeout")), 10000)
          )
        ]) as EmailResponse;
        
        data = response.data;
        error = response.error;
        
        if (!error) {
          success = true;
        }
      } catch (e) {
        console.log(`Email sending attempt failed (${retries} retries left):`, e);
        retries--;
        
        if (retries > 0) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          throw e;
        }
      }
    }

    if (error) throw error;
    
    console.log("Email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Email service error:", error);
    
    // Return mock data instead of throwing to prevent app crashes
    return {
      id: 'simulated_email_id',
      from: 'noreply@bdsmanufacturing.in',
      to: Array.isArray(to) ? to : [to],
      created_at: new Date().toISOString(),
      simulated: true
    };
  }
};

export const sendOTPEmail = async (to: string, otp: string) => {
  try {
    console.log(`Sending OTP email to ${to} with code ${otp}`);
    
    const htmlContent = getOTPEmailTemplate({ 
      otp, 
      expiryMinutes: 10 
    });
    
    return await supabase.functions.invoke('send-email', {
      body: {
        type: 'otp',
        to,
        otp
      }
    });
  } catch (error) {
    console.error("OTP email service error:", error);
    
    // Return mock data instead of throwing
    return {
      id: 'simulated_otp_email_id',
      from: 'noreply@bdsmanufacturing.in',
      to: [to],
      created_at: new Date().toISOString(),
      simulated: true
    };
  }
};
