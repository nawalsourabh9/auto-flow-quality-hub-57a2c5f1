
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create admin user
    const { data: userData, error: signUpError } = await supabase.auth.admin.createUser({
      email: 'rishabhjn732@gmail.com',
      password: 'Rishabh@123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Rishabh',
        last_name: 'Jain',
        role: 'super_admin'
      }
    });

    if (signUpError) throw signUpError;

    if (!userData.user) {
      throw new Error('Failed to create user');
    }

    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userData.user.id,
        first_name: 'Rishabh',
        last_name: 'Jain',
        email: 'rishabhjn732@gmail.com',
      });

    if (profileError) throw profileError;

    // Create team member entry
    const { error: teamMemberError } = await supabase
      .from('team_members')
      .insert({
        name: 'Rishabh Jain',
        email: 'rishabhjn732@gmail.com',
        position: 'Quality Manager',
        initials: 'RJ',
        user_id: userData.user.id
      });

    if (teamMemberError) {
      console.error('Error creating team member:', teamMemberError);
      // Continue even if team member creation fails
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Super Admin user created successfully',
        user: userData.user
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error creating super admin:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
