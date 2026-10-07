const { createAuthClient, supabaseService } = require('../../server/supabase')

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const body = req.body || {}
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!fullName || fullName.length > 255 || !email || !password) {
    return res.status(400).json({ success: false, message: 'Enter your name, email, and password.' })
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' })
  }

  try {
    const { data, error } = await createAuthClient().auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
    if (error) return res.status(400).json({ success: false, message: error.message })
    if (!data.user || !data.user.id || (Array.isArray(data.user.identities) && data.user.identities.length === 0)) {
      return res.status(409).json({ success: false, message: 'Unable to create this account. Check whether the email is already registered.' })
    }

    const { error: profileError } = await supabaseService.from('users').insert({
      auth_user_id: data.user.id,
      full_name: fullName,
      email,
      role: 'staff',
      status: 'active'
    })
    if (profileError) {
      console.error('Failed to create registration profile:', profileError.message)
      return res.status(500).json({ success: false, message: 'Your account was created, but its profile could not be saved. Please contact an administrator.' })
    }

    const result = { success: true }
    if (data.session) {
      result.user = { email, name: fullName, role: 'staff' }
      result.session = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    }
    return res.status(201).json(result)
  } catch (error) {
    console.error('Registration failed:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to create your account right now.' })
  }
}
