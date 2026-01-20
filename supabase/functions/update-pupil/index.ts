import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId, email, name, password } = await req.json()

    if (!userId) {
      throw new Error('User ID is required')
    }

    console.log(`Updating pupil account: ${userId}`)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Build update object
    const updateData: Record<string, any> = {}
    
    if (email) {
      updateData.email = email
    }
    
    if (password && password.length > 0) {
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }
      updateData.password = password
    }
    
    if (name) {
      updateData.user_metadata = { name }
    }

    // Update auth user if there are auth changes
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData)
      
      if (updateError) {
        console.error('Error updating user:', updateError.message)
        throw updateError
      }
    }

    // Update profile name if provided
    if (name) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (profileError) {
        console.error('Error updating profile:', profileError.message)
        throw profileError
      }
    }

    console.log(`Pupil updated successfully: ${userId}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pupil account updated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Error in update-pupil function:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
