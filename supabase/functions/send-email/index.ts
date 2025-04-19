
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { getOTPEmailTemplate } from "./emailTemplates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Configure SMTP client
const getSmtpClient = async () => {
  return new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: {
        username: Deno.env.get("EMAIL_USERNAME") || "",
        password: Deno.env.get("EMAIL_PASSWORD") || "",
      },
    },
  });
};

interface SendEmailParams {
  to: string | string[];
  subject: string;
  body: string;
  isHtml?: boolean;
}

interface OTPEmailParams {
  to: string;
  otp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log("Email request received:", JSON.stringify(requestData, null, 2));

    // Check if this is an OTP email request
    if (requestData.type === "otp") {
      const { to, otp }: OTPEmailParams = requestData;
      
      const htmlContent = getOTPEmailTemplate({ 
        otp, 
        expiryMinutes: 10 
      });
      
      console.log(`Sending OTP email to ${to} with code ${otp}`);
      
      // Use SMTP client
      const client = await getSmtpClient();
      
      try {
        const emailResponse = await client.send({
          from: Deno.env.get("EMAIL_USERNAME") || "",
          to: to,
          subject: "Your Verification Code",
          html: htmlContent,
        });

        await client.close();
        
        console.log("OTP email sent successfully:", emailResponse);
        return new Response(JSON.stringify(emailResponse), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        await client.close();
        throw error;
      }
    } 
    
    // Standard email request
    const { to, subject, body, isHtml = false }: SendEmailParams = requestData;
    
    console.log(`Sending standard email to ${to}`);
    
    // Use SMTP client
    const client = await getSmtpClient();
    
    try {
      const emailResponse = await client.send({
        from: Deno.env.get("EMAIL_USERNAME") || "",
        to: Array.isArray(to) ? to : [to],
        subject,
        html: isHtml ? body : `<p>${body}</p>`,
      });

      await client.close();
      
      console.log("Email sent successfully:", emailResponse);
      return new Response(JSON.stringify(emailResponse), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      await client.close();
      throw error;
    }
  } catch (error) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
