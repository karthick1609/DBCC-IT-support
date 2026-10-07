const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) {
  console.warn('SUPABASE_URL not set')
}

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

module.exports = { supabaseAnon, supabaseService }
