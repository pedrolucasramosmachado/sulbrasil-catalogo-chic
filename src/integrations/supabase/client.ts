import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import safeStorage from '@/lib/safeStorage';

// O Vite expõe variáveis de ambiente através de import.meta.env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn("Supabase credentials missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.");
}

// Usa safeStorage com fallback em memória para suportar Safari Privado e
// outros browsers que bloqueiam localStorage silenciosamente.
export const supabase = createClient<Database>(
  SUPABASE_URL || '', 
  SUPABASE_PUBLISHABLE_KEY || '', 
  {
    auth: {
      storage: safeStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);