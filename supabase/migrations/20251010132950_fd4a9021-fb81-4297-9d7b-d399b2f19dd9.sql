-- Atualizar Manga Longa Gola alta para ser subcategoria de Blusas manga longa
UPDATE products 
SET category = 'Blusas manga longa', subcategory = 'Manga Longa Gola alta'
WHERE category = 'Manga Longa Gola alta';