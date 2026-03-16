
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://fuiagxnyjiadmzayroxp.supabase.co";
const SUPABASE_KEY = "sb_publishable_5JIC6xMXZKgbYSKkM9fEcA_lC7lFZ8f";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debug() {
  const { data, error } = await supabase
    .from('products')
    .select('name, category, subcategory')
    .eq('category', 'T-Shirt');

  if (error) {
    console.error(error);
    return;
  }

  const subcats = {};
  data.forEach(p => {
    const s = p.subcategory || 'NULL/EMPTY';
    subcats[s] = (subcats[s] || 0) + 1;
  });

  console.log('T-Shirt subcategory distribution:');
  console.log(JSON.stringify(subcats, null, 2));
}

debug();
