-- Add promotion fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_promotion BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS promotion_price NUMERIC;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_is_promotion ON products(is_promotion) WHERE is_promotion = true;

-- Add comment
COMMENT ON COLUMN products.is_promotion IS 'Indicates if product is currently in promotion';
COMMENT ON COLUMN products.promotion_price IS 'Special promotion price when is_promotion is true';