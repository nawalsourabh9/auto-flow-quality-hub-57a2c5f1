
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { getOTPEmailTemplate } from "./emailTemplates.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
      
      const emailResponse = await resend.emails.send({
        from: "Lovable <onboarding@resend.dev>",
        to: to,
        subject: "Your Verification Code",
        html: htmlContent,
      });

      console.log("OTP email sent successfully:", emailResponse);
      return new Response(JSON.stringify(emailResponse), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } 
    
    // Standard email request
    const { to, subject, body, isHtml = false }: SendEmailParams = requestData;
    
    console.log(`Sending standard email to ${to}`);
    
    const emailResponse = await resend.emails.send({
      from: "Lovable <onboarding@resend.dev>",
      to: Array.isArray(to) ? to : [to],
      subject,
      html: isHtml ? body : `<p>${body}</p>`,
    });

    console.log("Email sent successfully:", emailResponse);
    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
