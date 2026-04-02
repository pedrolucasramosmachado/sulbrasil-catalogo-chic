import fs from 'fs';

async function extractSitemap() {
  try {
    console.log('Fetching sitemap...');
    const response = await fetch('https://www.sulbrasilmodas.com.br/sitemap.xml');
    const xmlData = await response.text();

    const products = [];
    
    // Regex to match <url> blocks
    const urlRegex = /<url>([\s\S]*?)<\/url>/g;
    let match;

    while ((match = urlRegex.exec(xmlData)) !== null) {
      const urlBlock = match[1];
      
      const locMatch = urlBlock.match(/<loc>(.*?)<\/loc>/);
      const imageLocMatch = urlBlock.match(/<image:loc>(.*?)<\/image:loc>/);

      if (locMatch && imageLocMatch) {
        const loc = locMatch[1];
        const imageUrl = imageLocMatch[1];
        
        // Extract product name from slug or loc
        const slug = loc.split('/').filter(Boolean).pop();
        if (slug && loc.includes('/produtos/')) {
          const productName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

          products.push({
            produto: productName,
            slug: slug,
            imagem: imageUrl
          });
        }
      }
    }

    console.log(`Found ${products.length} products with images.`);
    
    // Make sure directory exists
    const dir = './src/data';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync('./src/data/sulbrasil_sitemap.json', JSON.stringify(products, null, 2));
    console.log('Saved to src/data/sulbrasil_sitemap.json');
  } catch (error) {
    console.error('Error:', error);
  }
}

extractSitemap();

