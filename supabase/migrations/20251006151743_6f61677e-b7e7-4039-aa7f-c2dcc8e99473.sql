-- Adicionar coluna subcategory à tabela products
ALTER TABLE public.products 
ADD COLUMN subcategory text;

-- Adicionar índice para melhorar performance de consultas por subcategoria
CREATE INDEX idx_products_subcategory ON public.products(subcategory);