const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Ler .env.local
const envLocalPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`VITE_R2_${name}\\s*=\\s*([^\\r\\n]+)`));
  return match ? match[1].trim() : null;
};

const ACCOUNT_ID = getEnvVar('ACCOUNT_ID');
const ACCESS_KEY_ID = getEnvVar('ACCESS_KEY_ID');
const SECRET_ACCESS_KEY = getEnvVar('SECRET_ACCESS_KEY');
const BUCKET_NAME = getEnvVar('BUCKET_NAME');

console.log('Configurações R2 encontradas:');
console.log(`ACCOUNT_ID: ${ACCOUNT_ID ? 'Sim' : 'Não'}`);
console.log(`ACCESS_KEY_ID: ${ACCESS_KEY_ID ? 'Sim' : 'Não'}`);
console.log(`SECRET_ACCESS_KEY: ${SECRET_ACCESS_KEY ? 'Sim' : 'Não'}`);
console.log(`BUCKET_NAME: ${BUCKET_NAME}`);

if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET_NAME) {
  console.error('Faltando variáveis de ambiente do R2!');
  process.exit(1);
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

async function listObjects() {
  try {
    console.log('Listando objetos no bucket R2...');
    const data = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        MaxKeys: 100,
      })
    );
    console.log(`Objetos encontrados: ${data.KeyCount || 0}`);
    if (data.Contents && data.Contents.length > 0) {
      console.log('Primeiros 20 objetos no R2:');
      data.Contents.slice(0, 20).forEach(obj => {
        console.log(`- ${obj.Key} (${obj.Size} bytes)`);
      });
    } else {
      console.log('O bucket está vazio.');
    }
  } catch (error) {
    console.error('Erro ao listar objetos do R2:', error);
  }
}

listObjects();
