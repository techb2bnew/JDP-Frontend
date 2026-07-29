import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ajjhorzzoajbfownxbgo.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqamhvcnp6b2FqYmZvd254YmdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDU0ODAsImV4cCI6MjA5MjAyMTQ4MH0.ri5WPvKzRXSo-0BEu9raYl5U8cPkKOjhVsHIQUn_C8Y'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Log Supabase initialization
if (typeof window !== 'undefined') {
  console.log('Supabase client initialized:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey
  })
}

