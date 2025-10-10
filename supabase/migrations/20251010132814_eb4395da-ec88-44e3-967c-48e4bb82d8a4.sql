-- Atualizar Plus Size (com S maiúsculo) para ser subcategoria de Regatas
UPDATE products 
SET category = 'Regatas', subcategory = 'Plus Size'
WHERE category = 'Plus Size' OR category = 'Plus size';