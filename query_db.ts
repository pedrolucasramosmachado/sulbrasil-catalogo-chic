import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://fuiagxnyjiadmzayroxp.supabase.co";
const supabaseKey = "sb_publishable_5JIC6xMXZKgbYSKkM9fEcA_lC7lFZ8f";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Querying Supabase...');
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, image_url')
      .limit(10);
    
    if (error) {
      console.error('Error fetching products:', error);
      return;
    }
    
    console.log('Sample Products:', data);
  } catch (e) {
    console.error('Catch error:', e);
  }
}

main();
