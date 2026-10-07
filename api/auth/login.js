const { createAuthClient, supabaseService } = require('../../server/supabase')

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const body = req.body || {}
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Enter your email and password.' })
  }

  try {
    const { data, error } = await createAuthClient().auth.signInWithPassword({ email, password })
    if (error) return res.status(401).json({ success: false, message: 'Invalid email or password, or email confirmation is still required.' })

    const { data: profile, error: profileError } = await supabaseService
      .from('users')
      .select('full_name,email,role,status')
      .eq('auth_user_id', data.user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Failed to load sign-in profile:', profileError.message)
      return res.status(500).json({ success: false, message: 'Unable to load your account profile.' })
    }
    if (!profile || profile.status !== 'active' || !['staff', 'admin', 'principal'].includes(profile.role)) {
      return res.status(403).json({ success: false, message: 'This account is not active or is not authorized to sign in.' })
    }

    return res.status(200).json({
      success: true,
      user: { email: profile.email, name: profile.full_name, role: profile.role }
    })
  } catch (error) {
    console.error('Sign-in failed:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to sign in right now.' })
  }
}
