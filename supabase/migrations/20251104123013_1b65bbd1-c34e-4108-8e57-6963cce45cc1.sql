-- Rename promotion_price to promotion_wholesale_price and add promotion_retail_price
ALTER TABLE products RENAME COLUMN promotion_price TO promotion_wholesale_price;
ALTER TABLE products ADD COLUMN promotion_retail_price NUMERIC;

-- Add comments for clarity
COMMENT ON COLUMN products.promotion_wholesale_price IS 'Promotional wholesale price';
COMMENT ON COLUMN products.promotion_retail_price IS 'Promotional retail price';