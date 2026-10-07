require('dotenv').config()

const { createClient } = require('@supabase/supabase-js')

async function findAuthUserByEmail(auth, email) {
  const perPage = 1000
  for (let page = 1; ; page += 1) {
    const { data, error } = await auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const user = data.users.find(candidate => candidate.email && candidate.email.toLowerCase() === email)
    if (user) return user
    if (data.users.length < perPage) return null
  }
}

async function provisionAdmin() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  const email = process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !email || !password) {
    throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, and ADMIN_PASSWORD must be set.')
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  let authUser = await findAuthUserByEmail(supabase.auth, email)
  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Administrator' }
    })
    if (error) throw error
    authUser = data.user
  }

  const { data: profileByAuthId, error: authProfileError } = await supabase
    .from('users')
    .select('id,full_name')
    .eq('auth_user_id', authUser.id)
    .maybeSingle()
  if (authProfileError) throw authProfileError

  if (profileByAuthId) {
    const { error } = await supabase
      .from('users')
      .update({ role: 'admin', status: 'active', email })
      .eq('id', profileByAuthId.id)
    if (error) throw error
  } else {
    const { data: profileByEmail, error: emailProfileError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    if (emailProfileError) throw emailProfileError

    const profile = {
      auth_user_id: authUser.id,
      full_name: authUser.user_metadata && authUser.user_metadata.full_name || 'Administrator',
      email,
      role: 'admin',
      status: 'active'
    }

    const query = profileByEmail
      ? supabase.from('users').update(profile).eq('id', profileByEmail.id)
      : supabase.from('users').insert(profile)
    const { error } = await query
    if (error) throw error
  }

  console.log('Admin account is ready. Existing Auth passwords are left unchanged.')
}

provisionAdmin().catch(error => {
  console.error('Could not provision the admin account:', error.message)
  process.exitCode = 1
})
