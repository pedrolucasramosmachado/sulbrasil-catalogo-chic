-- Move todos os produtos da categoria "Nulla Manga" para categoria "Regatas" com subcategoria "Nulla Manga"
UPDATE products 
SET 
  subcategory = 'Nulla Manga',
  category = 'Regatas'
WHERE category = 'Nulla Manga';

-- Move todos os produtos da categoria "Plus size" com "regata" no nome para categoria "Regatas" com subcategoria "Plus size"
UPDATE products 
SET 
  subcategory = 'Plus size',
  category = 'Regatas'
WHERE category = 'Plus size' AND LOWER(name) LIKE '%regata%';