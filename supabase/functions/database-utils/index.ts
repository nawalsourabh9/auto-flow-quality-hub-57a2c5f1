import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { operation, ...params } = await req.json()
    switch (operation) {
      case 'deleteUser':
        const { userId } = params
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Missing required field: userId' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          )
        }

        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          )
        }

        return new Response(
          JSON.stringify({ data: { message: 'User deleted successfully' } }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      case 'updateProfile':
        const { userId, data } = params;
        if (!userId || !data) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: userId and data' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        // Ensure data keys match your database columns
        const { firstName, lastName, email } = data;

        const { error: updateError } = await supabaseAdmin
          .from('profiles') // Replace 'profiles' with your actual table name
          .update({
            first_name: firstName,
            last_name: lastName,
            email: email,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        return new Response(
          JSON.stringify({ data: { message: 'Profile updated successfully' } }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      case 'updateUserApproval':
        const { userId, approved } = params;
        
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Missing required field: userId' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { user_metadata: { approved } }
        );

        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'User approval status updated' }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      default:
        return new Response(
          JSON.stringify({ error: 'Unsupported operation' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
    }
  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
