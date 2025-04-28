
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  role?: string;
  departmentId?: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  phone?: string;
  supervisorId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    console.log("Starting invitation process");
    
    // Initialize the Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData = await req.json();
    console.log("Received request data:", JSON.stringify(requestData, null, 2));
    
    const { email, role, departmentId, firstName, lastName, position, phone, supervisorId }: InvitationRequest = requestData;
    
    if (!email) {
      console.error("Email is required but was not provided");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing invitation for: ${email}, role: ${role}, departmentId: ${departmentId}`);

    // Check if a user with this email already exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (userCheckError) {
      console.error("Error checking existing user:", userCheckError);
      throw new Error("Error checking if user exists");
    }

    if (existingUser) {
      console.log("User already exists:", existingUser);
      return new Response(
        JSON.stringify({ error: "User with this email already exists" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create a team member record
    if (firstName && lastName && position) {
      const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
      console.log(`Creating team member with initials: ${initials}`);

      const { error: teamMemberError } = await supabase
        .from("team_members")
        .insert([
          {
            name: `${firstName} ${lastName}`,
            email: email,
            position: position,
            department_id: departmentId || null,
            phone: phone || null,
            supervisor_id: supervisorId || null,
            initials: initials
          }
        ]);

      if (teamMemberError) {
        console.error("Error creating team member:", teamMemberError);
        // We continue with the invitation even if team member creation fails
      } else {
        console.log("Team member created successfully");
      }
    }

    console.log("Sending Supabase invitation email");
    
    // Generate a sign-up link with a custom token and send invitation email
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${req.headers.get("origin")}/accept-invite`,
      data: {
        role: role || "user",
        departmentId: departmentId,
        firstName: firstName,
        lastName: lastName,
        position: position,
        phone: phone,
        supervisorId: supervisorId,
        invited_at: new Date().toISOString(),
      },
    });

    if (error) {
      console.error("Error sending Supabase invitation:", error);
      throw error;
    }

    console.log("Supabase invitation sent successfully");

    // Also send a custom email notification for better user experience
    try {
      console.log("Attempting to send custom invitation email");
      
      await sendCustomInvitationEmail({
        to: email, 
        firstName: firstName || "",
        lastName: lastName || "",
        position: position || "",
        origin: req.headers.get("origin") || ""
      });
      console.log("Custom invitation email sent successfully");
    } catch (emailError) {
      console.error("Failed to send custom invitation email:", emailError);
      // Continue even if custom email fails, since Supabase invitation was sent
    }

    return new Response(
      JSON.stringify({ success: true, message: "Invitation sent successfully", data }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Function to send a custom email invitation
async function sendCustomInvitationEmail({ to, firstName, lastName, position, origin }: {
  to: string;
  firstName: string;
  lastName: string;
  position: string;
  origin: string;
}) {
  const username = Deno.env.get("EMAIL_USERNAME");
  const password = Deno.env.get("EMAIL_PASSWORD");

  if (!username || !password) {
    console.error("Missing email credentials");
    throw new Error("Email configuration is incomplete");
  }

  console.log(`Using email credentials: ${username} (password hidden)`);
  
  try {
    // Configure SMTP client with error handling
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
      debug: true, // Enable debug logging
    });

    const fullName = firstName && lastName ? `${firstName} ${lastName}` : to;
    const positionText = position ? ` as ${position}` : "";

    console.log(`Sending email to: ${to}, fullName: ${fullName}`);
    
    // Send email with timeout handling
    const sendPromise = client.send({
      from: username,
      to,
      subject: "Invitation to Join BDS Manufacturing QMS",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e4; border-radius: 5px;">
          <h1 style="color: #0055a4; margin-bottom: 20px;">Welcome to BDS Manufacturing!</h1>
          <p>Hello ${fullName},</p>
          <p>You have been invited to join BDS Manufacturing's Quality Management System${positionText}.</p>
          <p>Our QMS platform helps us maintain compliance with IATF 16949 and ISO 9001 standards while improving our quality processes.</p>
          <p>You will receive a separate email with a link to set up your account. If you don't see it, please check your spam folder.</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${origin}/accept-invite" style="background-color: #0055a4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Accept Invitation</a>
          </div>
          <p>If you have any questions, please contact your administrator.</p>
          <p>Thank you,<br>BDS Manufacturing QMS Team</p>
        </div>
      `,
    });

    // Set a timeout for the email sending operation
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Email sending timed out")), 30000);
    });

    // Wait for either the send operation to complete or timeout
    await Promise.race([sendPromise, timeout]);

    console.log("Email sent, closing connection");
    await client.close();
    console.log("SMTP connection closed");
  } catch (error) {
    console.error("Error sending custom invitation email:", error);
    throw new Error(`Failed to send custom invitation email: ${error.message}`);
  }
}
