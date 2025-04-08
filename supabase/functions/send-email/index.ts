
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, body, isHtml = false, cc, bcc, replyTo } = await req.json() as EmailRequest;
    console.log(`Attempting to send email to: ${to}`);

    // Get credentials from environment variables
    const username = Deno.env.get("EMAIL_USERNAME");
    const password = Deno.env.get("EMAIL_PASSWORD");

    if (!username || !password) {
      console.error("Missing email credentials");
      return new Response(
        JSON.stringify({ error: "Email configuration is incomplete" }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Configure SMTP client for Outlook
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.office365.com",
        port: 587,
        tls: true,
        auth: {
          username,
          password,
        },
      },
    });

    // Send email
    await client.send({
      from: username,
      to: typeof to === "string" ? to : to.join(","),
      cc: cc ? (typeof cc === "string" ? cc : cc.join(",")) : undefined,
      bcc: bcc ? (typeof bcc === "string" ? bcc : bcc.join(",")) : undefined,
      replyTo: replyTo,
      subject: subject,
      content: isHtml ? undefined : body,
      html: isHtml ? body : undefined,
    });

    await client.close();
    
    console.log("Email sent successfully");
    
    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
});
