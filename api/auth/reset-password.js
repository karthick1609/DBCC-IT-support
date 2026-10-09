const { createAuthClient } = require('../../server/supabase')

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const body = req.body || {}
  const accessToken = typeof body.access_token === 'string' ? body.access_token : ''
  const refreshToken = typeof body.refresh_token === 'string' ? body.refresh_token : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!accessToken || !refreshToken || !password) {
    return res.status(400).json({ success: false, message: 'The password reset link is invalid or expired.' })
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' })
  }

  try {
    const auth = createAuthClient().auth
    const { data, error } = await auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    })
    if (error || !data.user) {
      return res.status(400).json({ success: false, message: 'The password reset link is invalid or expired. Request a new one.' })
    }

    const { error: updateError } = await auth.updateUser({ password })
    if (updateError) {
      console.error('Password update failed:', updateError.message)
      return res.status(400).json({ success: false, message: 'Could not update the password. Request a new reset link and try again.' })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Password reset failed:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to reset your password right now.' })
  }
}
