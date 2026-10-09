const { createAuthClient } = require('../../server/supabase')

function getAppUrl() {
  const configuredUrl = process.env.APP_URL || (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`)
  if (!configuredUrl) {
    if (process.env.NODE_ENV === 'production') throw new Error('APP_URL must be configured for password recovery.')
    return 'http://localhost:3000'
  }

  const appUrl = new URL(configuredUrl)
  if (!['http:', 'https:'].includes(appUrl.protocol) || appUrl.username || appUrl.password) {
    throw new Error('APP_URL must be a valid HTTP or HTTPS URL.')
  }
  return appUrl.origin
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const email = typeof (req.body || {}).email === 'string' ? req.body.email.trim().toLowerCase() : ''
  if (!email || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Enter a valid email address.' })
  }

  try {
    const redirectTo = new URL('/frontend/reset-password.html', getAppUrl()).toString()
    const { error } = await createAuthClient().auth.resetPasswordForEmail(email, { redirectTo })
    if (error) {
      console.error('Password reset email request failed:', error.message)
      return res.status(502).json({ success: false, message: 'Could not send a password reset email. Please try again later.' })
    }

    return res.status(200).json({
      success: true,
      message: 'If an account exists for that email, a password reset link will be sent shortly.'
    })
  } catch (error) {
    console.error('Password reset email request failed:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to request a password reset right now.' })
  }
}
