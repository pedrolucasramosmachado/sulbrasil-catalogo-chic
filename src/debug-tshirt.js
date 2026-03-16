
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://fuiagxnyjiadmzayroxp.supabase.co";
const SUPABASE_KEY = "sb_publishable_5JIC6xMXZKgbYSKkM9fEcA_lC7lFZ8f"; // Publishable key

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debug() {
  console.log('--- Debugging T-Shirt Category ---');
  
  // Check products in T-Shirt category
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, category, subcategory, image_url')
    .ilike('category', 'T-Shirt%');

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Found ${products.length} products in T-Shirt category.`);
  
  const subcategories = [...new Set(products.map(p => p.subcategory))];
  console.log('Subcategories found:', subcategories);

  // Check a few images
  for (const p of products.slice(0, 3)) {
    console.log(`Checking image for ${p.name}: ${p.image_url}`);
    try {
      const res = await fetch(p.image_url, { method: 'HEAD' });
      console.log(`Status: ${res.status} ${res.statusText}`);
    } catch (e) {
      console.log(`Fetch error: ${e.message}`);
    }
  }

  // Also check plural version for safety
  const { data: productsPlural } = await supabase
    .from('products')
    .select('id')
    .eq('category', 'T-Shirts');
  
  console.log(`Found ${productsPlural ? productsPlural.length : 0} products with category 'T-Shirts' (plural).`);
}

debug();
