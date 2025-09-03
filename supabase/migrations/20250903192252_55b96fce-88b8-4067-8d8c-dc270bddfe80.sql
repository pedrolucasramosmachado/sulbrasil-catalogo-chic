-- Add wholesale and retail price columns
ALTER TABLE public.products 
ADD COLUMN wholesale_price numeric,
ADD COLUMN retail_price numeric;

-- Update existing products to use retail_price from old price column
UPDATE public.products 
SET retail_price = price 
WHERE price IS NOT NULL;

-- Drop the old price column
ALTER TABLE public.products 
DROP COLUMN price;