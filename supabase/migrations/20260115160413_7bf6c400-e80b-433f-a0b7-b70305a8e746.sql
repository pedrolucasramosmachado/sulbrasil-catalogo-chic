-- Add weight column to products table (in kg)
ALTER TABLE public.products 
ADD COLUMN weight_kg numeric NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.products.weight_kg IS 'Product weight in kilograms for shipping calculation';