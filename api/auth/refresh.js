const { createAuthClient, supabaseService } = require('../../server/supabase')

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const refreshToken = typeof (req.body || {}).refresh_token === 'string' ? req.body.refresh_token : ''
  if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token is required.' })

  try {
    const { data, error } = await createAuthClient().auth.refreshSession({ refresh_token: refreshToken })
    if (error || !data.session || !data.user) {
      return res.status(401).json({ success: false, message: 'Your session expired. Please sign in again.' })
    }

    const { data: profile, error: profileError } = await supabaseService
      .from('users')
      .select('status')
      .eq('auth_user_id', data.user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Failed to check refreshed session profile:', profileError.message)
      return res.status(500).json({ success: false, message: 'Unable to refresh your session.' })
    }
    if (!profile || profile.status !== 'active') {
      return res.status(403).json({ success: false, message: 'This account is not active.' })
    }

    return res.status(200).json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    })
  } catch (error) {
    console.error('Session refresh failed:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to refresh your session right now.' })
  }
}
