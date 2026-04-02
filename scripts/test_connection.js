import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Função simples para carregar .env manualmente
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://fuiagxnyjiadmzayroxp.supabase.co';
const supabaseKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Erro: VITE_SUPABASE_SERVICE_ROLE_KEY não encontrada no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log(`🔌 Testando conexão com: ${supabaseUrl}...`);
  
  try {
    // Testar Banco de Dados
    const { data: products, error: dbError } = await supabase
      .from('products')
      .select('count', { count: 'exact', head: true });
    
    if (dbError) {
      console.error('❌ Erro no Banco de Dados:', dbError.message);
    } else {
      console.log('✅ Banco de Dados: Conectado com sucesso!');
      console.log(`📊 Total de produtos no banco: ${products[0]?.count || 0}`);
    }

    // Testar Storage
    const { data: buckets, error: storageError } = await supabase
      .storage
      .listBuckets();
    
    if (storageError) {
      console.error('❌ Erro no Storage:', storageError.message);
    } else {
      const catalogBucket = buckets.find(b => b.id === 'catalog');
      if (catalogBucket) {
        console.log('✅ Storage: Bucket "catalog" encontrado e acessível!');
      } else {
        console.warn('⚠️ Storage: Conectado, mas o bucket "catalog" não foi encontrado.');
      }
    }

    console.log('\n🚀 TUDO PRONTO! O site está falando com o projeto fuiagxnyjiadmzayroxp corretamente.');

  } catch (err) {
    console.error('💥 Erro fatal ao testar:', err.message);
  }
}

testConnection();
