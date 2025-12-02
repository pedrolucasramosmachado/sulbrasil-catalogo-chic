-- Transformar subcategorias de "Regatas" em categorias principais
-- Atualizar cada subcategoria para ser uma categoria principal

-- Sarah -> categoria principal "Sarah"
UPDATE products 
SET category = subcategory, subcategory = NULL 
WHERE category = 'Regatas' AND subcategory IN ('Sarah', 'Sarah Listrada');

-- Cropped -> categoria principal "Cropped"
UPDATE products 
SET category = 'Cropped', subcategory = NULL 
WHERE category = 'Regatas' AND subcategory = 'Cropped';

-- Nulla Manga -> categoria principal "Nulla Manga"
UPDATE products 
SET category = 'Nulla Manga', subcategory = NULL 
WHERE category = 'Regatas' AND subcategory = 'Nulla Manga';

-- Luna -> categoria principal "Luna"
UPDATE products 
SET category = 'Luna', subcategory = NULL 
WHERE category = 'Regatas' AND subcategory = 'Regata Luna';

-- Regata Sarah Bicolor -> categoria principal "Sarah Bicolor"
UPDATE products 
SET category = 'Sarah Bicolor', subcategory = NULL 
WHERE category = 'Regatas' AND subcategory = 'Regata Sarah Bicolor';

-- Regata Celina -> categoria principal "Celina"
UPDATE products 
SET category = 'Celina', subcategory = NULL 
WHERE category = 'Regatas' AND subcategory = 'Regata Celina';

-- Regata Gola Alta Chloe -> categoria principal "Chloe"
UPDATE products 
SET category = 'Chloe', subcategory = NULL 
WHERE category = 'Regatas' AND subcategory = 'Regata Gola Alta Chloe';