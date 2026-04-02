import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env loading
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyUpdates() {
  const sqlFile = path.join(process.cwd(), 'scripts', 'updates.sql');
  const content = fs.readFileSync(sqlFile, 'utf8');
  
  // Regex to extract ID and Image URL from the UPDATE statements
  // Format: UPDATE public.products SET image_url = 'URL' WHERE id = 'ID';
  const regex = /UPDATE public\.products SET image_url = '(.*?)' WHERE id = '(.*?)';/g;
  let match;
  const updates = [];
  
  while ((match = regex.exec(content)) !== null) {
    updates.push({
      image_url: match[1],
      id: match[2]
    });
  }

  console.log(`Found ${updates.length} updates to apply...`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < updates.length; i++) {
    const { id, image_url } = updates[i];
    
    const { error } = await supabase
      .from('products')
      .update({ image_url })
      .eq('id', id);

    if (error) {
      console.error(`Error updating product ${id}:`, error.message);
      errorCount++;
    } else {
      successCount++;
    }

    if ((i + 1) % 50 === 0) {
      console.log(`Progress: ${i + 1}/${updates.length} applied...`);
    }
  }

  console.log('\n--- Migration Finished ---');
  console.log(`Total Success: ${successCount}`);
  console.log(`Total Errors: ${errorCount}`);
}

applyUpdates().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
