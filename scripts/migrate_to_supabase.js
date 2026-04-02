import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

const SUPABASE_URL = "https://fuiagxnyjiadmzayroxp.supabase.co";
// POR FAVOR: COLOQUE A SUA SERVICE_ROLE_KEY AQUI OU NO .env COMO VITE_SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "SUA_CHAVE_AQUI";

const rawData = fs.readFileSync('./src/data/sulbrasil_sitemap.json', 'utf8');
const sitemap = JSON.parse(rawData);
console.log('Total de itens no sitemap:', sitemap.length);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrate() {
    const migrationLog = [];
    const limit = process.argv[2] ? parseInt(process.argv[2]) : sitemap.length;

    console.log(`Iniciando migração de ${limit} imagens para o Supabase Storage...`);

    for (let i = 0; i < Math.min(limit, sitemap.length); i++) {
        const item = sitemap[i];
        const { produto, imagem, slug } = item;

        console.log(`[${i + 1}/${limit}] Migrando: ${produto}`);

        try {
            const response = await fetch(imagem);
            if (!response.ok) {
                console.error(`  - ERRO ao baixar ${imagem}: Status ${response.status}`);
                continue;
            }

            const buffer = await response.arrayBuffer();
            const filename = `${slug}.webp`;

            const { data, error } = await supabase.storage
                .from('catalog')
                .upload(filename, buffer, {
                    contentType: 'image/webp',
                    upsert: true
                });

            if (error) {
                console.error(`  - ERRO no upload para o Supabase: ${error.message}`);
                continue;
            }

            const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/catalog/${filename}`;

            migrationLog.push({
                productName: produto,
                slug: slug,
                oldUrl: imagem,
                newUrl: publicUrl
            });

            console.log(`  - SUCESSO: ${publicUrl}`);
        } catch (error) {
            console.error(`  - ERRO inesperado: ${error.message}`);
        }
    }

    fs.writeFileSync('./scripts/migration_success.json', JSON.stringify(migrationLog, null, 2));
    console.log(`Finalizado. ${migrationLog.length} imagens migradas com sucesso.`);
}

if (SUPABASE_SERVICE_ROLE_KEY === "SUA_CHAVE_AQUI") {
    console.error("ERRO: SERVICE_ROLE_KEY não configurada. Adicione ao .env ou edite o script.");
    process.exit(1);
}

migrate().catch(console.error);
