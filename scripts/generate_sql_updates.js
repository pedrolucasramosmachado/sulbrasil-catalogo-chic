import fs from 'fs';

const migrationResults = JSON.parse(fs.readFileSync('./scripts/migration_success.json', 'utf8'));
const sitemap = JSON.parse(fs.readFileSync('./src/data/sulbrasil_sitemap.json', 'utf8'));
const rawData = fs.readFileSync('./scripts/supabase_products.json', 'utf8');

// Resilient parsing to handle MCP output wrapper
let supabaseProducts;
try {
    const wrappedData = JSON.parse(rawData);
    const content = wrappedData.result || rawData;
    const match = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!match) throw new Error('No JSON array found in content');
    supabaseProducts = JSON.parse(match[0]);
} catch (e) {
    console.error('Failed to parse Supabase JSON:', e.message);
    process.exit(1);
}

function normalize(str) {
  if (!str) return '';
  return str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^\w\s]/gi, ' ') 
    .replace(/\s+/g, ' ')
    .trim();
}

function getWords(str) {
    return normalize(str).split(' ').filter(w => w.length >= 2);
}

const sqlUpdates = [];
const matches = [];
const missing = [];

for (const product of supabaseProducts) {
    const sbWords = getWords(product.name);
    if (sbWords.length === 0) {
        missing.push(product.name);
        continue;
    }

    let bestMatch = null;
    let maxIntersection = 0;
    let minDiff = 100;

    for (const mig of migrationResults) {
        // Use productName from migration result if available, else derive from slug
        const migName = mig.productName || mig.slug.replace(/-/g, ' ');
        const migWords = getWords(migName);
        
        const intersection = sbWords.filter(w => migWords.includes(w)).length;
        const diff = Math.abs(sbWords.length - migWords.length);

        if (intersection > maxIntersection) {
            maxIntersection = intersection;
            minDiff = diff;
            bestMatch = mig;
        } else if (intersection === maxIntersection && intersection > 0) {
            if (diff < minDiff) {
                minDiff = diff;
                bestMatch = mig;
            }
        }
    }

    // Match criteria: at least 2 words or 50% of words for short names
    const threshold = Math.min(2, Math.ceil(sbWords.length * 0.5));
    if (maxIntersection >= threshold) {
        sqlUpdates.push(`UPDATE public.products SET image_url = '${bestMatch.newUrl}' WHERE id = '${product.id}'; -- Matched: ${product.name.trim()} -> ${bestMatch.productName || bestMatch.slug}`);
        matches.push({ 
            supabaseName: product.name, 
            matchedWith: bestMatch.productName || bestMatch.slug,
            score: maxIntersection 
        });
    } else {
        missing.push(product.name);
    }
}

fs.writeFileSync('./scripts/updates.sql', sqlUpdates.join('\n'));
console.log(`Matched: ${matches.length}`);
console.log(`Missing: ${missing.length}`);
fs.writeFileSync('./scripts/match_report.json', JSON.stringify({ matched: matches, missing: missing }, null, 2));
