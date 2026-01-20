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
    const { email, password, name } = await req.json()

    // Validate input
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required')
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    console.log(`Creating pupil account for: ${email}`)

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

    // Try to create the user with admin API
    let userId: string
    let userEmail: string
    
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name
      }
    })

    if (userError) {
      // Check if user already exists
      if (userError.message.includes('already been registered')) {
        console.log(`User ${email} already exists, updating password and checking role...`)
        
        // Find the existing user
        const { data: users } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
        
        if (!existingUser) {
          throw new Error('Could not find existing user')
        }
        
        userId = existingUser.id
        userEmail = existingUser.email || email
        
        // Update the password for the existing user
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password,
          user_metadata: { name }
        })
        
        if (updateError) {
          console.error('Error updating user password:', updateError.message)
          throw updateError
        }
        
        console.log(`Password updated for existing user ${email}`)
        
        // Check if they already have pupil role
        const { data: existingRole } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'pupil')
          .maybeSingle()
        
        if (existingRole) {
          console.log(`User ${email} already has pupil role`)
          return new Response(
            JSON.stringify({
              success: true,
              message: 'User updated with new password',
              user: { id: userId, email: userEmail, name }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
      } else {
        console.error('Error creating user:', userError.message)
        throw userError
      }
    } else if (userData.user) {
      userId = userData.user.id
      userEmail = userData.user.email || email
      console.log(`User created with ID: ${userId}`)
    } else {
      throw new Error('Failed to create user')
    }

    // Create pupil role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'pupil'
      }, { onConflict: 'user_id,role' })

    if (roleError) {
      console.error('Error creating role:', roleError.message)
      throw roleError
    }

    console.log(`Pupil role assigned to user: ${userId}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pupil account created successfully',
        user: {
          id: userId,
          email: userEmail,
          name
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Error in create-pupil function:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
