
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/smtp_client.ts";
import { corsHeaders } from "../_shared/cors.ts";

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
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    console.log("Email function received request");
    const { to, subject, body, isHtml = false, cc, bcc, replyTo } = await req.json() as EmailRequest;
    console.log(`Attempting to send email to: ${to}, subject: ${subject}`);

    // Get credentials from environment variables
    const username = Deno.env.get("EMAIL_USERNAME");
    const password = Deno.env.get("EMAIL_PASSWORD");

    if (!username || !password) {
      console.error("Missing email credentials");
      throw new Error("Email configuration is incomplete");
    }

    console.log("Email credentials found, configuring SMTP client");

    // Configure SMTP client for Outlook
    const client = new SmtpClient({
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

    // Prepare email content
    const emailContent = {
      from: username,
      to: typeof to === "string" ? to : to.join(","),
      cc: cc ? (typeof cc === "string" ? cc : cc.join(",")) : undefined,
      bcc: bcc ? (typeof bcc === "string" ? bcc : bcc.join(",")) : undefined,
      replyTo: replyTo,
      subject: subject,
      content: isHtml ? undefined : body,
      html: isHtml ? body : undefined,
    };

    console.log("Sending email with the following configuration:", {
      from: username,
      to: emailContent.to,
      subject: emailContent.subject,
      hasContent: !!emailContent.content,
      hasHtml: !!emailContent.html
    });

    // Send email
    await client.send(emailContent);
    console.log("Email sent via SMTP client");

    await client.close();
    console.log("SMTP client connection closed");
    
    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred", stack: error.stack }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
