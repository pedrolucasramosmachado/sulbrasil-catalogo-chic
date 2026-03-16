
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://fuiagxnyjiadmzayroxp.supabase.co";
const SUPABASE_KEY = "sb_publishable_5JIC6xMXZKgbYSKkM9fEcA_lC7lFZ8f";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debug() {
  const { data, error } = await supabase
    .from('products')
    .select('name, image_url')
    .ilike('name', 'T-shirt%');

  if (error) {
    console.error(error);
    return;
  }

  const working = data.find(p => p.name.includes('Rosa Bebê'));
  const broken = data.find(p => p.name.includes('Nude'));

  console.log('Working Product:', working);
  console.log('Broken Product:', broken);

  if (working) {
    const res = await fetch(working.image_url, { method: 'HEAD' });
    console.log(`Working Image Status: ${res.status} ${res.statusText}`);
  }

  if (broken) {
    const res = await fetch(broken.image_url, { method: 'HEAD' });
    console.log(`Broken Image Status: ${res.status} ${res.statusText}`);
    
    // Test alternative extension .webmp
    const altUrl = broken.image_url.replace('.webp', '.webmp');
    console.log(`Checking Alt URL (webmp): ${altUrl}`);
    const res2 = await fetch(altUrl, { method: 'HEAD' });
    console.log(`Alt URL Status: ${res2.status} ${res2.statusText}`);
  }
}

debug();
