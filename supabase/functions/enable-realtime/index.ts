
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

serve(async (req) => {
  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Parse the table name from the request
    const { table_name } = await req.json()

    if (!table_name) {
      return new Response(
        JSON.stringify({ error: 'Table name is required' }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Enable replica identity FULL for the table
    const setReplicaResult = await supabaseAdmin.rpc('exec_sql', {
      query: `ALTER TABLE public.${table_name} REPLICA IDENTITY FULL;`
    })

    if (setReplicaResult.error) {
      throw new Error(`Failed to set replica identity: ${setReplicaResult.error.message}`)
    }

    // Add the table to the supabase_realtime publication
    const addToPublicationResult = await supabaseAdmin.rpc('exec_sql', {
      query: `
        ALTER PUBLICATION supabase_realtime ADD TABLE public.${table_name};
      `
    })

    if (addToPublicationResult.error) {
      throw new Error(`Failed to add to publication: ${addToPublicationResult.error.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Table ${table_name} enabled for real-time updates` 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
