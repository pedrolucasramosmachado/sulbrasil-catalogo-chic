-- Add is_out_of_stock field to products table
ALTER TABLE public.products 
ADD COLUMN is_out_of_stock boolean DEFAULT false;