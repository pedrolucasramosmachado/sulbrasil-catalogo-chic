-- Criar categoria Vestidos e mover Vestidos Jade como subcategoria
UPDATE products 
SET category = 'Vestidos', subcategory = 'Vestidos Jade'
WHERE category = 'Vestidos Jade';