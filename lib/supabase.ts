import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://buluqwfuujaiaxmqqpxa.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bHVxd2Z1dWphaWF4bXFxcHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzkzMDcsImV4cCI6MjA3ODY1NTMwN30.2OHMkkbkqnWPDZX_-zsOp9vfkX-UOzj5UmJ8tKfxXrI'

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

