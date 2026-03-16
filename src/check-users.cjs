
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://fuiagxnyjiadmzayroxp.supabase.co";
const SUPABASE_KEY = "sb_publishable_5JIC6xMXZKgbYSKkM9fEcA_lC7lFZ8f";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debug() {
  // Querying auth.users might require service_role key, which I don't have.
  // But I can check the 'profiles' table if it exists
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.log('Could not query profiles (probably RLS):', error.message);
  } else {
    console.log('Profiles found:', profiles);
  }
}

debug();
