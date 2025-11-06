-- Add is_launch column to products table
ALTER TABLE public.products 
ADD COLUMN is_launch boolean DEFAULT false;