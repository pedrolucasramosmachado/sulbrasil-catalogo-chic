import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// O Vite expõe variáveis de ambiente através de import.meta.env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn("Supabase credentials missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.");
}

export const supabase = createClient<Database>(
  SUPABASE_URL || '', 
  SUPABASE_PUBLISHABLE_KEY || '', 
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);