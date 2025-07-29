// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sgyxdpvqdsfalcyotezj.supabase.co' 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNneXhkcHZxZHNmYWxjeW90ZXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3OTMxMTIsImV4cCI6MjA2OTM2OTExMn0.a2VcRTFLF1LKDnjv1UcviXCcpgv_BLVTEq0DjDaifVA' // Substitua pela sua Chave Anon

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)