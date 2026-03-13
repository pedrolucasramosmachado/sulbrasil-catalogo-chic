
-- Default sizes for most categories
UPDATE products SET sizes = ARRAY['Tamanho Único (36 ao 44)']
WHERE sizes IS NULL AND category NOT IN ('Infantis', 'Plus Size', 'Kits');

-- Infantis
UPDATE products SET sizes = ARRAY['2','4','6','8','10','12']
WHERE sizes IS NULL AND category = 'Infantis';

-- Plus Size
UPDATE products SET sizes = ARRAY['44','46','48','50','52','54']
WHERE sizes IS NULL AND category = 'Plus Size';

-- Kits
UPDATE products SET sizes = ARRAY['Tamanho Único']
WHERE sizes IS NULL AND category = 'Kits';
