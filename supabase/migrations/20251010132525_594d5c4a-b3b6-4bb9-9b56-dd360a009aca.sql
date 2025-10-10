-- Atualizar Plus size, Sarah Listrada e Cropped para serem subcategorias de Regatas
UPDATE products 
SET category = 'Regatas', subcategory = 'Plus size'
WHERE category = 'Plus size';

UPDATE products 
SET category = 'Regatas', subcategory = 'Sarah Listrada'
WHERE category = 'Sarah Listrada';

UPDATE products 
SET category = 'Regatas', subcategory = 'Cropped'
WHERE category = 'Cropped';

-- Criar categoria "Blusas manga longa" e reorganizar subcategorias
UPDATE products 
SET category = 'Blusas manga longa', 
    subcategory = CASE 
        WHEN name LIKE '%Gola alta%' OR name LIKE '%Gola Alta%' THEN 'Manga Longa Gola alta'
        ELSE 'Manga Longa'
    END
WHERE category = 'Manga Longa';

-- Criar categoria "Shorts" e reorganizar subcategorias
UPDATE products 
SET category = 'Shorts',
    subcategory = CASE 
        WHEN name LIKE '%Liz%' THEN 'short Liz'
        WHEN name LIKE '%Gretta%' OR name LIKE '%gretta%' THEN 'short gretta'
        ELSE subcategory
    END
WHERE category IN ('short Liz', 'short gretta') OR name LIKE '%Short%';