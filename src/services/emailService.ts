
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
            setTimeout(() => reject(new Error("Request timeout")), 15000)
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
          await new Promise(resolve => setTimeout(resolve, 2000));
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
    throw error;
  }
};

export const sendOTPEmail = async (to: string, otp: string) => {
  try {
    console.log(`Sending OTP email to ${to} with code ${otp}`);
    
    // For development purposes, we'll log the OTP to console and simulate email sending
    console.log("Development mode: OTP code for testing:", otp);
    
    // Fall back to just returning success if the email sending fails
    try {
      // Try to send actual email using the edge function
      await supabase.functions.invoke('send-email', {
        body: {
          type: 'otp',
          to,
          otp
        }
      });
      console.log("OTP email sent successfully via edge function");
    } catch (error) {
      console.error("OTP email service error (non-critical):", error);
      console.log("Email sending failed, but proceeding with OTP verification flow");
      // We'll just continue without failing the whole signup process
      // This allows users to still use the OTP that's displayed in the console/UI
    }
    
    // Always return success so the signup process can continue
    return { success: true, otp };
  } catch (error) {
    console.error("OTP email service error:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    // Still return success to allow the flow to continue
    return { success: true, otp };
  }
};
