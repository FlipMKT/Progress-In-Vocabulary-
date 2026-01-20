import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    // Try to create admin user (or get existing)
    let adminUserId: string
    const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@accelerateVocab.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        name: 'Admin User'
      }
    })

    if (adminError) {
      if (adminError.message.includes('already been registered')) {
        // User exists, fetch their ID
        const { data: users } = await supabaseAdmin.auth.admin.listUsers()
        const existingAdmin = users.users.find(u => u.email === 'admin@acceleratevocab.com')
        if (!existingAdmin) throw new Error('Could not find existing admin user')
        adminUserId = existingAdmin.id
        console.log('Admin user already exists, using existing ID')
      } else {
        throw adminError
      }
    } else {
      adminUserId = adminUser.user.id
    }

    // Create admin role (ignore if exists)
    await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: adminUserId,
        role: 'admin'
      }, { onConflict: 'user_id,role' })

    // Try to create pupil user (or get existing)
    let pupilUserId: string
    const { data: pupilUser, error: pupilError } = await supabaseAdmin.auth.admin.createUser({
      email: 'pupil@accelerateVocab.com',
      password: 'pupil123',
      email_confirm: true,
      user_metadata: {
        name: 'Test Pupil'
      }
    })

    if (pupilError) {
      if (pupilError.message.includes('already been registered')) {
        // User exists, fetch their ID
        const { data: users } = await supabaseAdmin.auth.admin.listUsers()
        const existingPupil = users.users.find(u => u.email === 'pupil@acceleratevocab.com')
        if (!existingPupil) throw new Error('Could not find existing pupil user')
        pupilUserId = existingPupil.id
        console.log('Pupil user already exists, using existing ID')
      } else {
        throw pupilError
      }
    } else {
      pupilUserId = pupilUser.user.id
    }

    // Create pupil role (ignore if exists)
    await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: pupilUserId,
        role: 'pupil'
      }, { onConflict: 'user_id,role' })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test users created successfully',
        users: {
          admin: {
            email: 'admin@accelerateVocab.com',
            password: 'admin123'
          },
          pupil: {
            email: 'pupil@accelerateVocab.com',
            password: 'pupil123'
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
