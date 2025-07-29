// src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js'

// Obtém a URL e a chave anónima do teu projeto Supabase
// É uma boa prática usar variáveis de ambiente (.env.local)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Verifica se as variáveis foram carregadas corretamente
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("URL ou Chave Anónima do Supabase não encontradas. Verifica o teu ficheiro .env.local")
}

// Exporta o cliente Supabase para ser usado na aplicação
export const supabase = createClient(supabaseUrl, supabaseAnonKey)