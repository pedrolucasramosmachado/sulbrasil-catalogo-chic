-- Move all products with "regata" in the title to category "Regatas"
-- Their current category becomes the subcategory (including Nulla manga, Plus size, etc.)

UPDATE products 
SET 
  subcategory = category,
  category = 'Regatas'
WHERE LOWER(name) LIKE '%regata%' AND category != 'Regatas';