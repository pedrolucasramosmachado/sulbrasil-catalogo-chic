-- Move all products with "regata" in name or category to category "Regatas"
-- and set their current category as subcategory

-- First, update products where category contains "Regata"
UPDATE products 
SET 
  subcategory = CASE 
    WHEN category LIKE '%Regata Sarah%' THEN 'Sarah'
    WHEN category LIKE '%Cropped%' AND LOWER(name) LIKE '%regata%' THEN 'Cropped'
    ELSE category
  END,
  category = 'Regatas'
WHERE LOWER(category) LIKE '%regata%' OR (LOWER(category) LIKE '%cropped%' AND LOWER(name) LIKE '%regata%');

-- Also update any products with "regata" in the name but not in category
UPDATE products 
SET 
  subcategory = category,
  category = 'Regatas'
WHERE LOWER(name) LIKE '%regata%' AND category != 'Regatas';