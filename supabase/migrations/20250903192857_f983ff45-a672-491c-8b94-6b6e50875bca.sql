-- Remove old fields and add sizes field
ALTER TABLE public.products 
DROP COLUMN whatsapp_message,
DROP COLUMN tags,
ADD COLUMN sizes text[];