
const { createClient } = require('@supabase/supabase-js');

async function debug() {
  const images = [
    "https://xgjinyfnauwjjgjzyiju.supabase.co/storage/v1/object/public/catalog/1756946474102-pbc7zrlk8c.jpg",
    "https://xgjinyfnauwjjgjzyiju.supabase.co/storage/v1/object/public/catalog/1760111932549-sdfr9yw2et.webp"
  ];

  for (const url of images) {
    console.log(`Checking: ${url}`);
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(`Status: ${res.status} ${res.statusText}`);
    } catch (e) {
      console.log(`Fetch error: ${e.message}`);
    }
  }
}

debug();
