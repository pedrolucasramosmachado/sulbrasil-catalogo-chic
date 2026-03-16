
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://fuiagxnyjiadmzayroxp.supabase.co";
const SUPABASE_KEY = "sb_publishable_5JIC6xMXZKgbYSKkM9fEcA_lC7lFZ8f";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debug() {
  const { data, error } = await supabase
    .from('products')
    .select('category');

  if (error) {
    console.error(error);
    return;
  }

  const counts = {};
  data.forEach(p => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });

  console.log('Category breakdown:');
  console.log(JSON.stringify(counts, null, 2));
}

debug();
