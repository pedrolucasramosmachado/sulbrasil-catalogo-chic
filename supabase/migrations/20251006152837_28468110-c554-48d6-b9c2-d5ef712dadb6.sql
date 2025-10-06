-- Move all products with "regata" in the name to "regatas" subcategory
UPDATE products 
SET subcategory = 'regatas'
WHERE LOWER(name) LIKE '%regata%' OR LOWER(category) LIKE '%regata%';