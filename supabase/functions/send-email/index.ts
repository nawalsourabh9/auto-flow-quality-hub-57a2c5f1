
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { getOTPEmailTemplate } from "./emailTemplates.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Configure SMTP client
const getSmtpClient = async () => {
  try {
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.bdsmanufacturing.in",
        port: 465,
        tls: true,
        auth: {
          username: Deno.env.get("EMAIL_USERNAME") || "",
          password: Deno.env.get("EMAIL_PASSWORD") || ""
        }
      }
    });
    
    console.log("SMTP client initialized successfully");
    return client;
  } catch (error) {
    console.error("SMTP client initialization error:", error);
    throw new Error(`Failed to initialize SMTP client: ${error.message}`);
  }
};

serve(async (req) => {
  // Handle CORS preflight requests - this is critical
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: corsHeaders 
    });
  }

  let client;
  
  try {
    const requestData = await req.json();
    console.log("Email request received:", JSON.stringify(requestData, null, 2));
    
    if (requestData.type === "otp") {
      const { to, otp } = requestData;
      
      const htmlContent = getOTPEmailTemplate({
        otp,
        expiryMinutes: 10
      });
      
      console.log(`Sending OTP email to ${to} with code ${otp}`);
      console.log("Using username:", Deno.env.get("EMAIL_USERNAME"));
      
      client = await getSmtpClient();
      
      const emailResponse = await client.send({
        from: Deno.env.get("EMAIL_USERNAME") || "",
        to: to,
        subject: "Your Verification Code",
        html: htmlContent
      });
      
      console.log("OTP email sent successfully:", emailResponse);
      return new Response(JSON.stringify(emailResponse), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } 
    
    const { to, subject, body, isHtml = false } = requestData;
    
    console.log(`Sending standard email to ${to}`);
    
    client = await getSmtpClient();
    
    const emailResponse = await client.send({
      from: Deno.env.get("EMAIL_USERNAME") || "",
      to: Array.isArray(to) ? to : [to],
      subject,
      html: isHtml ? body : `<p>${body}</p>`
    });
    
    console.log("Email sent successfully:", emailResponse);
    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in send-email function:", error);
    return new Response(JSON.stringify({
      error: "Failed to send email",
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } finally {
    if (client) {
      try {
        await client.close();
        console.log("SMTP connection closed");
      } catch (closeError) {
        console.error("Error closing SMTP connection:", closeError);
      }
    }
  }
});
