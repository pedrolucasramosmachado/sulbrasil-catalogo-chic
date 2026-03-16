
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://fuiagxnyjiadmzayroxp.supabase.co";
const SUPABASE_KEY = "sb_publishable_5JIC6xMXZKgbYSKkM9fEcA_lC7lFZ8f";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debug() {
  const { data, error } = await supabase
    .from('products')
    .select('name, category, subcategory')
    .ilike('category', 'T-Shirt');

  if (error) {
    console.error(error);
    return;
  }

  console.log('T-Shirt Subcategories details:');
  data.forEach(p => {
    console.log(`- Product: "${p.name}", Subcategory: "${p.subcategory}" (Length: ${p.subcategory ? p.subcategory.length : 0})`);
  });
}

debug();
