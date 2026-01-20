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
    console.log('Fetching pupils with emails...')

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

    // Get all pupil user IDs
    const { data: rolesData, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'pupil')

    if (rolesError) {
      console.error('Error fetching roles:', rolesError.message)
      throw rolesError
    }

    const pupilIds = rolesData?.map(r => r.user_id) || []

    if (pupilIds.length === 0) {
      console.log('No pupils found')
      return new Response(
        JSON.stringify({ pupils: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Get profiles
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, name')
      .in('id', pupilIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError.message)
      throw profilesError
    }

    // Get auth users to get emails
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

    if (usersError) {
      console.error('Error fetching users:', usersError.message)
      throw usersError
    }

    // Create a map of user emails
    const emailMap = new Map<string, string>()
    usersData.users.forEach(user => {
      if (user.email) {
        emailMap.set(user.id, user.email)
      }
    })

    // Combine profile data with emails
    const pupils = (profilesData || []).map(profile => ({
      id: profile.id,
      name: profile.name,
      email: emailMap.get(profile.id) || ''
    }))

    console.log(`Found ${pupils.length} pupils`)

    return new Response(
      JSON.stringify({ pupils }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('Error in get-pupils function:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
