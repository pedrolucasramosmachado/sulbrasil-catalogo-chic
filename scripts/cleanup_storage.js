import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função simples para ler o .env
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseServiceKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Role Key in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupBucket() {
  const BUCKET_NAME = 'catalog';

  console.log(`Listing files in bucket: ${BUCKET_NAME}...`);
  const { data: files, error: listError } = await supabase
    .storage
    .from(BUCKET_NAME)
    .list('', { limit: 1000 });

  if (listError) {
    console.error("Error listing files:", listError);
    return;
  }

  if (!files || files.length === 0) {
    console.log("Bucket is already empty.");
    return;
  }

  const fileNames = files.map(f => f.name).filter(name => name !== '.emptyFolderPlaceholder');
  if (fileNames.length === 0) {
    console.log("No files to delete.");
    return;
  }

  console.log(`Deleting ${fileNames.length} files...`);

  const { data, error: deleteError } = await supabase
    .storage
    .from(BUCKET_NAME)
    .remove(fileNames);

  if (deleteError) {
    console.error("Error deleting files:", deleteError);
  } else {
    console.log(`Successfully deleted ${fileNames.length} files.`);
  }
}

cleanupBucket();
