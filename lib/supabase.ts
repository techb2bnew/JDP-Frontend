import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wkphkaswwihndprhlsfh.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcGhrYXN3d2lobmRwcmhsc2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5OTg1OTMsImV4cCI6MjA5OTU3NDU5M30.zH-ceC5KyFRTQAekCisNN9wCIKBb2z7rL-fY4A8R5xc'

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

