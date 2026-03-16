
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://fuiagxnyjiadmzayroxp.supabase.co";
const SUPABASE_KEY = "sb_publishable_5JIC6xMXZKgbYSKkM9fEcA_lC7lFZ8f";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debug() {
  const { data, error } = await supabase
    .from('products')
    .select('name, image_url')
    .or('image_url.ilike.%.webmp%,image_url.ilike.%.webm%');

  if (error) {
    console.error(error);
    return;
  }

  console.log('Products with webmp or webm extensions:', data);
}

debug();
