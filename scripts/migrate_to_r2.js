import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const rawData = fs.readFileSync('./src/data/sulbrasil_sitemap.json', 'utf8');
const sitemap = JSON.parse(rawData);
console.log('Total items in sitemap:', sitemap.length);

const ACCOUNT_ID = "324b4b112e5de45b1624ac04572c04d6";
const ACCESS_KEY_ID = "cfat_lGYPDajI79SihfesZrS1wvnKZ0kjlcBB7mxkNup45768e944";
const SECRET_ACCESS_KEY = "de265e1098e3ddeb922797ed312e8f9efcb6fdeb3195d579d360080d4d9f7ec6";
const BUCKET_NAME = "catalogosulbrasil";
const PUBLIC_URL = "https://pub-6fb86027593d4b42a262ddce8c515c20.r2.dev";

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

async function migrate() {
  const migrationLog = [];
  const limitArg = process.argv[2];
  const limit = limitArg ? parseInt(limitArg) : sitemap.length;
  
  console.log(`Starting migration with limit: ${limit}`);

  for (let i = 0; i < Math.min(limit, sitemap.length); i++) {
    const item = sitemap[i];
    const { produto, imagem, slug } = item;
    
    console.log(`[${i+1}/${limit}] Migrating: ${produto}`);
    
    try {
      const response = await fetch(imagem);
      if (!response.ok) {
          console.error(`  - FAILED to download ${imagem}: Status ${response.status}`);
          continue;
      }
      
      const buffer = await response.arrayBuffer();
      const filename = `${slug}.webp`;
      
      await r2Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: filename,
          Body: Buffer.from(buffer),
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000',
        })
      );
      
      const newUrl = `${PUBLIC_URL.replace(/\/$/, '')}/${filename}`;
      
      migrationLog.push({
        productName: produto,
        slug: slug,
        oldUrl: imagem,
        newUrl: newUrl
      });
      
      console.log(`  - SUCCESS: ${newUrl}`);
    } catch (error) {
      console.error(`  - ERROR: ${error.message}`);
    }
  }

  console.log(`Finished. Migration Log Size: ${migrationLog.length}`);
  fs.writeFileSync('./scripts/migration_results.json', JSON.stringify(migrationLog, null, 2));
  console.log('Saved to scripts/migration_results.json');
}

migrate().catch(console.error);
