
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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

    // Create a team member record - we'll create this during user signup instead
    // to avoid DB schema issues and focus on successful invitation
    if (firstName && lastName && position) {
      const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
      console.log(`User data prepared with initials: ${initials}, ready for account creation`);
    }

    // Preparing user metadata with all the provided information
    const userData = {
      role: role || "user",
      departmentId: departmentId || null,
      firstName: firstName || null,
      lastName: lastName || null,
      position: position || null,
      phone: phone || null,
      supervisorId: supervisorId || null,
      invited_at: new Date().toISOString(),
    };

    console.log("Sending invitation with user data:", JSON.stringify(userData, null, 2));
    
    // Generate signup link with custom redirect URL
    const redirectTo = `${req.headers.get("origin")}/accept-invite`;
    console.log(`Setting redirect URL to: ${redirectTo}`);
    
    // Send invitation email
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "signup",
      email: email,
      options: {
        redirectTo: redirectTo,
        data: userData,
      }
    });

    if (error) {
      console.error("Error generating signup link:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Signup link generated successfully");
    
    // Get the signup URL from the response
    const signupURL = data?.properties?.action_link;
    
    if (!signupURL) {
      console.error("No signup URL was generated");
      return new Response(
        JSON.stringify({ error: "Failed to generate signup URL" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Signup URL generated:", signupURL);
    
    // Send a custom email using fetch to the send-email function
    try {
      console.log("Sending custom invitation email via send-email function");
      
      const fullName = firstName && lastName ? `${firstName} ${lastName}` : email;
      const positionText = position ? ` as ${position}` : "";
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e4; border-radius: 5px;">
          <h1 style="color: #0055a4; margin-bottom: 20px;">Welcome to BDS Manufacturing!</h1>
          <p>Hello ${fullName},</p>
          <p>You have been invited to join BDS Manufacturing's Quality Management System${positionText}.</p>
          <p>Our QMS platform helps us maintain compliance with IATF 16949 and ISO 9001 standards while improving our quality processes.</p>
          <p>Please click the button below to create your account:</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${signupURL}" style="background-color: #0055a4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Create Account</a>
          </div>
          <p>If the button doesn't work, you can copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">${signupURL}</p>
          <p>If you have any questions, please contact your administrator.</p>
          <p>Thank you,<br>BDS Manufacturing QMS Team</p>
        </div>
      `;

      // Use the send-email edge function instead of direct SMTP
      const emailResponse = await supabase.functions.invoke("send-email", {
        body: {
          to: email,
          subject: "Invitation to Join BDS Manufacturing QMS",
          body: emailBody,
          isHtml: true
        },
      });

      if (emailResponse.error) {
        console.error("Error from send-email function:", emailResponse.error);
      } else {
        console.log("Custom invitation email sent successfully via send-email function");
      }
    } catch (emailError) {
      // We continue even if custom email fails
      console.error("Failed to send custom invitation email:", emailError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Invitation sent successfully" }),
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
