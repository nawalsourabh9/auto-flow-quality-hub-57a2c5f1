
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { SMTPClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

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
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Initialize the Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, role, departmentId, firstName, lastName, position }: InvitationRequest = await req.json();
    console.log("Received invitation request for:", email);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

      const { error: teamMemberError } = await supabase
        .from("team_members")
        .insert([
          {
            name: `${firstName} ${lastName}`,
            email: email,
            position: position,
            department_id: departmentId || null,
            initials: initials
          }
        ]);

      if (teamMemberError) {
        console.error("Error creating team member:", teamMemberError);
        // We continue with the invitation even if team member creation fails
      }
    }

    // Generate a sign-up link with a custom token and send invitation email
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${req.headers.get("origin")}/accept-invite`,
      data: {
        role: role || "user",
        departmentId: departmentId,
        firstName: firstName,
        lastName: lastName,
        position: position,
        invited_at: new Date().toISOString(),
      },
    });

    if (error) {
      console.error("Error sending Supabase invitation:", error);
      throw error;
    }

    // Also send a custom email notification for better user experience
    try {
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

  // Configure SMTP client
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

  const fullName = firstName && lastName ? `${firstName} ${lastName}` : to;
  const positionText = position ? ` as ${position}` : "";

  // Send email
  await client.send({
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

  await client.close();
}
